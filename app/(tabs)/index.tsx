import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.centerView}>
      <Text>Edit app/(tabs)/index.tsx to edit this screen.</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  centerView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  }
})