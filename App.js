import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as XLSX from "xlsx";

const Stack = createStackNavigator();

const SearchScreen = ({ navigation }) => {
  const [uniqueId, setUniqueId] = useState("");
  const [lookupTable, setLookupTable] = useState(null); // Lookup table to speed up the search
  const [isLoading, setIsLoading] = useState(true); // Track if data is still loading

  // Load the Excel data and create a lookup table
  useEffect(() => {
    const loadExcelData = async () => {
      try {
        const googleDriveFileId = "1bfBK0sr8uTexRi6SOhQxepQtNPs3bY_u";
        const url = `https://drive.google.com/uc?export=download&id=${googleDriveFileId}`;

        const response = await fetch(url);
        const fileData = await response.arrayBuffer();
        const data = new Uint8Array(fileData);
        const arr = Array.from(data)
          .map((x) => String.fromCharCode(x))
          .join("");

        const workbook = XLSX.read(arr, { type: "binary" });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];

        const excelData = XLSX.utils.sheet_to_json(worksheet);

        // Create a lookup table
        const table = {};
        const firstRow = excelData[0];
        const columnKey = Object.keys(firstRow).find(
          (key) => key.trim() === "Stud UID"
        );

        if (columnKey) {
          excelData.forEach((row) => {
            const usnValue = row[columnKey]?.trim().toLowerCase();
            if (usnValue) {
              table[usnValue] = row;
            }
          });
          setLookupTable(table); // Set the lookup table
        } else {
          console.error("Error: USN No. column not found");
        }
      } catch (error) {
        console.error("Error loading Excel data:", error);
      } finally {
        setIsLoading(false); // Data is fully loaded
      }
    };

    loadExcelData();
  }, []);

  // Function to search for the unique ID in the lookup table
  const searchInExcel = () => {
    if (isLoading) {
      setResult("Data is still loading, please wait.");
      return;
    }

    if (!lookupTable) {
      setResult("Error: Unable to load data.");
      return;
    }

    const found = lookupTable[uniqueId.trim().toLowerCase()];

    if (found) {
      // Navigate to the result screen with the full details
      navigation.navigate("Result", { result: found });
    } else {
      // If not found, navigate with a default message and photo
      navigation.navigate("Result", {
        result: "Bus Facility is not available.",
        photo: "wrong",
      });
    }
    setUniqueId(""); // Reset the input
  };

  return (
    <View style={styles.container}>
      <Image style={styles.image} source={require("./assets/sbjit_logo.png")} />

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          value={uniqueId}
          onChangeText={setUniqueId}
          placeholder="Enter USN No."
          placeholderTextColor="#716c76" // Change the placeholder text color here
        />
        <TouchableOpacity style={styles.button} onPress={searchInExcel}>
          <Text style={styles.buttonText}>Check</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ResultScreen = ({ route }) => {
  const result = route.params.result;
  const photo = route.params.photo;

  // Check if the result is a string (error message) or an object (found row)
  if (typeof result === "string") {
    return (
      <View style={styles.resultContainer}>
        {/* Display the fallback image and error message */}
        <Image style={styles.photo} source={require("./assets/wrong.png")} />
        <Text style={styles.resultText}>{result}</Text>
      </View>
    );
  }

  // Extract data from the result (valid row found)
  const {
    "Form No": formNo,
    "Stud UID": usn,
    NAME: name,
    Year: year,
    BRANCH: branch,
    "Bus Pickup Point": busPickup,
    Remark: remark,
  } = result;

  // Check if the remark contains a valid URL for the photo, else use a fallback image
  const photoUrl =
    remark && remark.startsWith("http")
      ? { uri: remark }
      : require("./assets/right.png");

  return (
    <ScrollView contentContainerStyle={styles.resultContainer}>
      {/* Display the image dynamically */}
      <Image style={styles.photo} source={photoUrl} />
      <View style={styles.textContainer}>
        <Text style={styles.resultText}>
          <Text style={{ fontWeight: "bold" }}>Form No.: </Text>
          {formNo}
        </Text>
        <Text style={styles.resultText}>
          <Text style={{ fontWeight: "bold" }}>USN No.: </Text>
          {usn}
        </Text>
        <Text style={styles.resultText}>
          <Text style={{ fontWeight: "bold" }}>Name: </Text>
          {name}
        </Text>
        <Text style={styles.resultText}>
          <Text style={{ fontWeight: "bold" }}>Year: </Text>
          {year}
        </Text>
        <Text style={styles.resultText}>
          <Text style={{ fontWeight: "bold" }}>Branch: </Text>
          {branch}
        </Text>
        <Text style={styles.resultText}>
          <Text style={{ fontWeight: "bold" }}>Bus Pickup Point: </Text>
          {busPickup}
        </Text>
      </View>
    </ScrollView>
  );
};

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{
            title: "Search",
            headerStyle: {
              backgroundColor: "#676693",
              height: 80, // Adjust height to increase the app bar's appearance
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
              fontSize: 24, // Increase the font size for the app bar title
              fontFamily: "serif", // Change font style, replace with desired font family
              textAlign: "center", // Center the title text
              width: "100%", // Make title span the entire width
            },
          }}
        />
        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{
            title: "Result",
            headerStyle: {
              backgroundColor: "#676693",
              height: 80, // Same app bar height for consistency
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
              fontSize: 24,
              fontFamily: "serif", // Change font style for consistency
              textAlign: "center",
              width: "100%",
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    marginTop: -180,
    backgroundColor: "#d9eecad2",
  },
  formContainer: {
    borderWidth: 2,
    borderColor: "#514e51",
    borderRadius: 10,
    padding: 20,
    backgroundColor: "#87c55ecd",
  },
  input: {
    height: 50,
    borderColor: "#0f0f0f",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#d9eecad2",
    color: "#0e0d0d",
    paddingHorizontal: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#8c88f7",
    paddingVertical: 10,
    marginHorizontal: 74,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  image: {
    width: "100%",
    height: 200,
    marginBottom: 4,
    resizeMode: "contain",
  },
  photo: {
    width: 200,
    height: 200,
    marginBottom: 20,
    borderRadius: 100,
  },
  resultContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#d9eecad2",
    padding: 4,
  },
  textContainer: {
    borderColor: "#0f0f0f",
    borderWidth: 1,
    borderRadius: 8,
    textAlign: "left",
    paddingBottom: 10,
  },
  resultText: {
    fontSize: 20,
    color: "#2B2968",
    marginTop: 10,
    textAlign: "left",
    paddingHorizontal: 10,
  },
});

export default App;
