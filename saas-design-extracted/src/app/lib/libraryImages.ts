import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseStorage } from "./firebase";
import { getFirebaseFirestore } from "./firebase";

/**
 * Converts a data URL (e.g. data:image/png;base64,...) to a Blob.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = (header.match(/data:([^;]+)/) || [])[1] || "image/png";
  const binary = atob(base64 || "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Uploads the processed image to Firebase Storage and saves a record to Firestore.
 * Path: generated-images/{userId}/{timestamp}.png
 */
export async function saveGeneratedImageToLibrary(
  userId: string,
  imageDataUrl: string,
  prompt: string
): Promise<string | null> {
  const storage = getFirebaseStorage();
  const db = getFirebaseFirestore();
  const timestamp = Date.now();
  const path = `generated-images/${userId}/${timestamp}.png`;

  const blob = dataUrlToBlob(imageDataUrl);
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, blob, { contentType: "image/png" });
  const downloadURL = await getDownloadURL(storageRef);

  const docRef = await addDoc(collection(db, "images"), {
    userId,
    imageUrl: downloadURL,
    createdAt: serverTimestamp(),
    source: "photoroom",
    prompt: prompt || "",
  });

  return docRef.id;
}
