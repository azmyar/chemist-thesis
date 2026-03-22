import { LobbyView } from "@/components/LobbyView";

interface UserPayload {
	user: { id: string; phone: string };
	profile: { name: string } | null;
	school: { name: string } | null;
}

export default async function LobbyPage() {
	const guestUser: UserPayload = {
		user: { id: "guest", phone: "" },
		profile: { name: "Pemain" },
		school: null,
	};

	return <LobbyView user={guestUser} />;
}
