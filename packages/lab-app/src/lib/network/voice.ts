import { gameClient } from "./client";
import type { ServerMessage } from "@/lib/protocol";

const RTC_CONFIG: RTCConfiguration = {
	iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export class VoiceChat {
	private peers: Map<string, RTCPeerConnection> = new Map();
	private localStream: MediaStream | null = null;
	private _muted = true;
	private unsubMessage: (() => void) | null = null;
	private onMuteChange: ((muted: boolean) => void) | null = null;

	get muted(): boolean {
		return this._muted;
	}

	onMuteStateChange(handler: (muted: boolean) => void): void {
		this.onMuteChange = handler;
	}

	async init(): Promise<void> {
		this.unsubMessage = gameClient.onMessage((msg) =>
			this.handleServerMessage(msg),
		);
	}

	async toggleMute(): Promise<void> {
		if (this._muted) {
			await this.unmute();
		} else {
			this.mute();
		}
	}

	private async unmute(): Promise<void> {
		if (!this.localStream) {
			try {
				this.localStream = await navigator.mediaDevices.getUserMedia({
					audio: true,
					video: false,
				});
			} catch (err) {
				console.warn("[VoiceChat] Microphone access denied:", err);
				return;
			}
		}

		// Enable audio tracks
		for (const track of this.localStream.getAudioTracks()) {
			track.enabled = true;
		}

		// Add tracks to existing peers
		for (const pc of this.peers.values()) {
			const senders = pc.getSenders();
			const hasAudio = senders.some((s) => s.track?.kind === "audio");
			if (!hasAudio) {
				for (const track of this.localStream.getAudioTracks()) {
					pc.addTrack(track, this.localStream);
				}
			}
		}

		this._muted = false;
		this.onMuteChange?.(false);
	}

	private mute(): void {
		if (this.localStream) {
			for (const track of this.localStream.getAudioTracks()) {
				track.enabled = false;
			}
		}
		this._muted = true;
		this.onMuteChange?.(true);
	}

	/** Called when a new player joins — the existing player initiates the offer */
	createOffer(peerId: string): void {
		if (this.peers.has(peerId)) return;
		const pc = this.createPeerConnection(peerId);
		this.peers.set(peerId, pc);

		// Add local tracks if we have them
		if (this.localStream) {
			for (const track of this.localStream.getAudioTracks()) {
				pc.addTrack(track, this.localStream);
			}
		}

		// We need a transceiver even if we have no local stream yet, so we can receive audio
		if (!this.localStream) {
			pc.addTransceiver("audio", { direction: "recvonly" });
		}

		pc.createOffer()
			.then((offer) => pc.setLocalDescription(offer))
			.then(() => {
				if (pc.localDescription) {
					gameClient.send({
						type: "signal",
						targetId: peerId,
						signal: {
							type: "offer",
							sdp: pc.localDescription.sdp,
						},
					});
				}
			})
			.catch((err) =>
				console.warn("[VoiceChat] Failed to create offer:", err),
			);
	}

	/** Called when we get a snapshot — connect to all existing players */
	connectToExistingPlayers(playerIds: string[]): void {
		for (const id of playerIds) {
			if (id === gameClient.selfId) continue;
			this.createOffer(id);
		}
	}

	removePeer(peerId: string): void {
		const pc = this.peers.get(peerId);
		if (pc) {
			pc.close();
			this.peers.delete(peerId);
		}
	}

	destroy(): void {
		this.unsubMessage?.();
		this.unsubMessage = null;

		for (const pc of this.peers.values()) {
			pc.close();
		}
		this.peers.clear();

		if (this.localStream) {
			for (const track of this.localStream.getTracks()) {
				track.stop();
			}
			this.localStream = null;
		}

		this._muted = true;
		this.onMuteChange = null;
	}

	private createPeerConnection(peerId: string): RTCPeerConnection {
		const pc = new RTCPeerConnection(RTC_CONFIG);

		pc.onicecandidate = (event) => {
			if (event.candidate) {
				gameClient.send({
					type: "signal",
					targetId: peerId,
					signal: {
						type: "ice-candidate",
						candidate: event.candidate.candidate,
						sdpMid: event.candidate.sdpMid,
						sdpMLineIndex: event.candidate.sdpMLineIndex,
					},
				});
			}
		};

		pc.ontrack = (event) => {
			// Play remote audio
			const audio = new Audio();
			audio.srcObject = event.streams[0] ?? new MediaStream([event.track]);
			audio.autoplay = true;
		};

		pc.onconnectionstatechange = () => {
			if (
				pc.connectionState === "failed" ||
				pc.connectionState === "closed"
			) {
				this.peers.delete(peerId);
			}
		};

		return pc;
	}

	private handleServerMessage(msg: ServerMessage): void {
		switch (msg.type) {
			case "snapshot": {
				const otherIds = msg.players
					.map((p) => p.id)
					.filter((id) => id !== msg.selfId);
				this.connectToExistingPlayers(otherIds);
				break;
			}
			case "player_join": {
				// New player joined — we create an offer to them
				if (msg.player.id !== gameClient.selfId) {
					this.createOffer(msg.player.id);
				}
				break;
			}
			case "player_leave": {
				this.removePeer(msg.playerId);
				break;
			}
			case "signal": {
				this.handleSignal(msg.fromId, msg.signal);
				break;
			}
		}
	}

	private handleSignal(
		fromId: string,
		signal: { type: string; [key: string]: unknown },
	): void {
		switch (signal.type) {
			case "offer": {
				this.handleOffer(fromId, signal.sdp as string);
				break;
			}
			case "answer": {
				const pc = this.peers.get(fromId);
				if (pc) {
					pc.setRemoteDescription(
						new RTCSessionDescription({
							type: "answer",
							sdp: signal.sdp as string,
						}),
					).catch((err) =>
						console.warn("[VoiceChat] Failed to set answer:", err),
					);
				}
				break;
			}
			case "ice-candidate": {
				const pc = this.peers.get(fromId);
				if (pc) {
					pc.addIceCandidate(
						new RTCIceCandidate({
							candidate: signal.candidate as string,
							sdpMid: signal.sdpMid as string | null,
							sdpMLineIndex: signal.sdpMLineIndex as number | null,
						}),
					).catch((err) =>
						console.warn("[VoiceChat] Failed to add ICE candidate:", err),
					);
				}
				break;
			}
		}
	}

	private handleOffer(fromId: string, sdp: string): void {
		// If we already have a connection, close it first (renegotiation)
		this.removePeer(fromId);

		const pc = this.createPeerConnection(fromId);
		this.peers.set(fromId, pc);

		// Add local tracks if available
		if (this.localStream) {
			for (const track of this.localStream.getAudioTracks()) {
				pc.addTrack(track, this.localStream);
			}
		}

		pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp }))
			.then(() => pc.createAnswer())
			.then((answer) => pc.setLocalDescription(answer))
			.then(() => {
				if (pc.localDescription) {
					gameClient.send({
						type: "signal",
						targetId: fromId,
						signal: {
							type: "answer",
							sdp: pc.localDescription.sdp,
						},
					});
				}
			})
			.catch((err) =>
				console.warn("[VoiceChat] Failed to handle offer:", err),
			);
	}
}

export const voiceChat = new VoiceChat();
