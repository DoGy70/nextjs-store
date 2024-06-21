"use server";

import { currentUser } from "@clerk/nextjs/server";
import db from "./db";
import { redirect } from "next/navigation";
import { imageSchema, productSchema, validateWithZodSchema } from "./schemas";
import { deleteImage, uploadImage } from "./supabase";
import { revalidatePath } from "next/cache";

async function getAuthUser() {
  const user = await currentUser();

  if (!user) redirect("/");

  return user;
}

async function getAdminUser() {
  const user = await getAuthUser();

  if (!user || user.id !== process.env.ADMIN_USER_ID) redirect("/");

  return user;
}

function renderError(error: unknown): { message: string } {
  console.log(error);

  return {
    message: error instanceof Error ? error.message : "an error occurred",
  };
}

export const fetchFeaturedProducts = async () => {
  const products = await db.product.findMany({
    where: {
      featured: true,
    },
  });

  return products;
};

export const fetchAllProducts = async ({ search = "" }: { search: string }) => {
  const products = await db.product.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return products;
};

export const fetchSingleProduct = async (productId: string) => {
  const product = await db.product.findUnique({
    where: {
      id: productId,
    },
  });

  if (!product) {
    redirect("/products");
  }

  return product;
};

export async function createProductAction(
  prevState: any,
  formData: FormData
): Promise<{ message: string }> {
  const user = await getAuthUser();

  try {
    const rawData = Object.fromEntries(formData);
    const file = formData.get("image") as File;
    const validatedFields = validateWithZodSchema(productSchema, rawData);
    const validatedFile = validateWithZodSchema(imageSchema, { image: file });
    const fullPath = await uploadImage(validatedFile.image);

    await db.product.create({
      data: {
        ...validatedFields,
        image: fullPath,
        clerkId: user.id,
      },
    });
  } catch (error) {
    return renderError(error);
  }

  redirect("/admin/products");
}

export async function fetchAdminProducts() {
  await getAdminUser();
  const products = await db.product.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return products;
}

export async function deleteProduct(prevState: { productId: string }) {
  const { productId } = prevState;
  await getAdminUser();
  try {
    const product = await db.product.delete({
      where: {
        id: productId,
      },
    });

    deleteImage(product.image);

    revalidatePath("/admin/products");
    return { message: "product removed" };
  } catch (error) {
    return renderError(error);
  }
}

export async function fetchAdminProductsDetails(productId: string) {
  await getAdminUser();
  const product = await db.product.findUnique({
    where: {
      id: productId,
    },
  });

  if (!product) redirect("/admin/products");

  return product;
}

export async function updateProductAction(prevState: any, formData: FormData) {
  await getAdminUser();

  try {
    const productId = formData.get("id") as string;
    const rawData = Object.fromEntries(formData);
    const validatedFields = validateWithZodSchema(productSchema, rawData);

    await db.product.update({
      where: {
        id: productId,
      },
      data: {
        ...validatedFields,
      },
    });
    revalidatePath(`/admin/products/${productId}/edit`);
    return { message: "Product updated successfully" };
  } catch (error) {
    return renderError(error);
  }
}

export async function updateProductImageAction(
  prevState: any,
  formData: FormData
) {
  await getAdminUser();

  try {
    const image = formData.get("image") as File;
    const productId = formData.get("id") as string;
    const oldImageUrl = formData.get("url") as string;

    const validatedFile = validateWithZodSchema(imageSchema, { image });
    const fullPath = await uploadImage(validatedFile.image);
    await deleteImage(oldImageUrl);
    await db.product.update({
      where: {
        id: productId,
      },
      data: {
        image: fullPath,
      },
    });
    revalidatePath(`/admin/products/${productId}/edit`);
    return { message: "Product image updated successfully" };
  } catch (error) {
    return renderError(error);
  }
}

export async function toggleFavoriteAction(prevState: {
  productId: string;
  favoriteId: string | null;
  pathname: string;
}) {
  const user = await getAuthUser();
  const { productId, favoriteId, pathname } = prevState;

  try {
    if (favoriteId) {
      await db.favorite.delete({
        where: {
          id: favoriteId,
        },
      });
    } else {
      await db.favorite.create({
        data: {
          productId,
          clerkId: user.id,
        },
      });
    }
    revalidatePath(pathname);
    return {
      message: favoriteId ? "removed from favorites" : "added to favorites",
    };
  } catch (error) {
    return renderError(error);
  }
}

export async function fetchFavoriteId({ productId }: { productId: string }) {
  const user = await getAuthUser();
  const favorite = await db.favorite.findFirst({
    where: {
      productId: productId,
      clerkId: user.id,
    },
    select: {
      id: true,
    },
  });

  return favorite?.id || null;
}

export async function fetchUserFavorites() {
  const user = await getAuthUser();
  const products = await db.favorite.findMany({
    where: {
      clerkId: user.id,
    },
    include: {
      product: true,
    },
  });

  return products;
}
