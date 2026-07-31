import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from './firebase';

/**
 * Subir imagen a Firebase Storage
 */
export async function uploadImage(file: File, path: string): Promise<string> {
  try {
    // Crear referencia con extensión del archivo
    const extension = file.name.split('.').pop();
    const storageRef = ref(storage, `${path}.${extension}`);

    // Subir archivo
    const snapshot = await uploadBytes(storageRef, file);

    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Error al subir imagen');
  }
}

/**
 * Eliminar imagen de Firebase Storage
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Extraer path de la URL
    const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/';
    if (!imageUrl.startsWith(baseUrl)) {
      throw new Error('URL inválida');
    }

    const path = imageUrl.replace(baseUrl, '').split('/o/')[1].split('?')[0];

    const decodedPath = decodeURIComponent(path);

    const storageRef = ref(storage, decodedPath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    // No lanzar error, solo logear (la imagen puede no existir)
  }
}
