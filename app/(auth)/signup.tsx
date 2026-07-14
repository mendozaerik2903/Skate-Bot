import { API_URL } from "@/utility/config";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { saveTokens } from "../../utility/auth";
import { migrateGuestBotsToAccount } from "../../utility/bot-builder";
import { fetchWithAuth } from "../../utility/fetchWithAuth";
import {
  clearGuestData,
  getGuestMatchHistory,
  isGuestMode,
} from "../../utility/guest-mode";

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      // sign them in immediately after signup
      const signinResponse = await fetch(`${API_URL}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const signinData = await signinResponse.json();

      await saveTokens(signinData.accessToken, signinData.refreshToken);

      // A guest signing up keeps their match history and bots. saveTokens()
      // above must happen first — everything below resolves the current
      // account by decoding the access token we just saved, so the bot
      // migration writes to the new account's storage key, not the guest's.
      if (await isGuestMode()) {
        const guestMatches = await getGuestMatchHistory();
        for (const match of guestMatches) {
          try {
            await fetchWithAuth("/games", {
              method: "POST",
              body: JSON.stringify({
                won: match.won,
                botPersona: match.botPersona,
                scoreWord: match.scoreWord,
                turns: match.turns,
              }),
            });
          } catch (migrateErr) {
            // Don't let one bad match block the rest, and don't block
            // entering the app over a migration failure.
            console.error("Failed to migrate guest match:", migrateErr);
          }
        }
        await migrateGuestBotsToAccount();
        await clearGuestData();
      }

      router.replace("/(tabs)");
    } catch (err) {
      setError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={"grey"}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor={"grey"}
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={"grey"}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(auth)/signin")}>
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  error: { color: "red", marginBottom: 16 },
  link: { textAlign: "center", color: "#666" },
});