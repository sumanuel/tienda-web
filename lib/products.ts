import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Product, ProductFormData } from '@/types/product';
import { uploadImage, deleteImage } from './storage';

const PRODUCTS_COLLECTION = 'products';

/**
 * Convierte Firestore Timestamp a Date
 */
function convertTimestamps(data: any): any {
  const converted = { ...data };
  if (converted.createdAt instanceof Timestamp) {
    converted.createdAt = converted.createdAt.toDate();
  }
  if (converted.updatedAt instanceof Timestamp) {
    converted.updatedAt = converted.updatedAt.toDate();
  }
  return converted;
}

/**
 * Genera código único de producto
 */
async function generateProductCode(storeId: string): Promise<string> {
  const productsRef = collection(db, PRODUCTS_COLLECTION);
  const q = query(
    productsRef,
    where('storeId', '==', storeId),
    orderBy('code', 'desc')
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return 'PROD-0001';
  }

  const lastCode = snapshot.docs[0].data().code as string;
  const numberPart = parseInt(lastCode.split('-')[1], 10);
  const newNumber = numberPart + 1;

  return `PROD-${newNumber.toString().padStart(4, '0')}`;
}

/**
 * Crear producto
 */
export async function createProduct(
  storeId: string,
  data: ProductFormData
): Promise<Product> {
  try {
    // Generar código si no se proporcionó
    let code = data.code;

    if (code) {
      // ✅ Validar que código manual no exista
      const existingQuery = query(
        collection(db, PRODUCTS_COLLECTION),
        where('storeId', '==', storeId),
        where('code', '==', code)
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        throw new Error(`El código ${code} ya está en uso`);
      }
    } else {
      code = await generateProductCode(storeId);
    }

    // Subir imagen si existe
    let imageUrl: string | undefined;
    if (data.image) {
      imageUrl = await uploadImage(data.image, `products/${storeId}/${code}`);
    }

    const productData = {
      storeId,
      code,
      barcode: data.barcode || null,
      name: data.name,
      description: data.description || null,
      category: data.category,
      prices: {
        VES: data.priceVES || null,
        USD: data.priceUSD || null,
        EUR: data.priceEUR || null,
      },
      cost: data.cost,
      costCurrency: data.costCurrency,
      stock: data.stock,
      stockMin: data.stockMin,
      trackInventory: data.trackInventory,
      supplierId: data.supplierId || null,
      imageUrl: imageUrl || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, PRODUCTS_COLLECTION),
      productData
    );

    const newProduct = {
      id: docRef.id,
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Product;

    return newProduct;
  } catch (error) {
    console.error('Error creating product:', error);
    throw new Error('Error al crear producto');
  }
}

/**
 * Obtener todos los productos de una tienda
 */
export async function getProducts(storeId: string): Promise<Product[]> {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const q = query(
      productsRef,
      where('storeId', '==', storeId),
      orderBy('name', 'asc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...convertTimestamps(data),
      } as Product;
    });
  } catch (error) {
    console.error('Error getting products:', error);
    throw new Error('Error al obtener productos');
  }
}

/**
 * Obtener producto por ID
 */
export async function getProductById(
  productId: string
): Promise<Product | null> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...convertTimestamps(data),
    } as Product;
  } catch (error) {
    console.error('Error getting product:', error);
    throw new Error('Error al obtener producto');
  }
}

/**
 * Actualizar producto
 */
export async function updateProduct(
  productId: string,
  data: Partial<ProductFormData>
): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);

    // Si hay una nueva imagen, subirla
    let imageUrl: string | undefined;
    if (data.image) {
      // Obtener producto actual para eliminar imagen anterior
      const currentProduct = await getProductById(productId);
      if (currentProduct?.imageUrl) {
        await deleteImage(currentProduct.imageUrl);
      }

      imageUrl = await uploadImage(
        data.image,
        `products/${currentProduct?.storeId}/${data.code || currentProduct?.code}`
      );
    }

    const updateData: any = {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.category && { category: data.category }),
      ...(data.barcode !== undefined && { barcode: data.barcode }),
      ...(data.cost !== undefined && { cost: data.cost }),
      ...(data.costCurrency && { costCurrency: data.costCurrency }),
      ...(data.stock !== undefined && { stock: data.stock }),
      ...(data.stockMin !== undefined && { stockMin: data.stockMin }),
      ...(data.trackInventory !== undefined && {
        trackInventory: data.trackInventory,
      }),
      ...(data.supplierId !== undefined && { supplierId: data.supplierId }),
      ...(imageUrl && { imageUrl }),
      updatedAt: serverTimestamp(),
    };

    // Actualizar precios si se proporcionaron
    if (
      data.priceVES !== undefined ||
      data.priceUSD !== undefined ||
      data.priceEUR !== undefined
    ) {
      updateData.prices = {
        VES: data.priceVES || null,
        USD: data.priceUSD || null,
        EUR: data.priceEUR || null,
      };
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating product:', error);
    throw new Error('Error al actualizar producto');
  }
}

/**
 * Eliminar producto
 */
export async function deleteProduct(productId: string): Promise<void> {
  try {
    // Obtener producto para eliminar imagen
    const product = await getProductById(productId);

    if (product?.imageUrl) {
      await deleteImage(product.imageUrl);
    }

    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw new Error('Error al eliminar producto');
  }
}

/**
 * Buscar productos por nombre o código
 */
export async function searchProducts(
  storeId: string,
  searchTerm: string
): Promise<Product[]> {
  const allProducts = await getProducts(storeId);
  const term = searchTerm.toLowerCase();

  return allProducts.filter((product) => {
    return (
      product.name.toLowerCase().includes(term) ||
      product.code.toLowerCase().includes(term) ||
      product.barcode?.toLowerCase().includes(term)
    );
  });
}

/**
 * Actualizar stock de producto
 */
export async function updateProductStock(
  productId: string,
  newStock: number
): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await updateDoc(docRef, {
      stock: newStock,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    throw new Error('Error al actualizar stock');
  }
}
