import CustomHeader from "@/components/CustomHeader";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function Global() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <CustomHeader title="events" rightIconName="information-circle" onRightIconPress={()=>null} />
        
      <View style={styles.mainContainer}>
        <Text>Coming soon</Text>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  mainContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
})