import { auth } from "@clerk/nextjs";

import prismadb from "@/lib/prismadb";
import { MAX_FREE_COUNTS } from "@/constants";

export const incrementApiLimit = async () => {
  //! get the current user ID from Clerk authentication
  const { userId } = auth();
  //! return early if no user is authenticated
  if (!userId) {
    return;
  }

  const userApiLimit = await prismadb.userApiLimit.findUnique({
    where: { userId: userId },
  });

  if (userApiLimit) {
    await prismadb.userApiLimit.update({
      where: { userId: userId },
      data: { count: userApiLimit.count + 1 },
    });
  } else {
    await prismadb.userApiLimit.create({
      data: { userId: userId, count: 1 },
    });
  }
};

export const checkApiLimit = async () => {
  const { userId } = auth();

  if (!userId) {
    return false;
  }

  //! find the user's current API limit record

  const userApiLimit = await prismadb.userApiLimit.findUnique({
    where: { userId: userId },
  });

  if (!userApiLimit || userApiLimit.count < MAX_FREE_COUNTS) {
    //!if user exists , increment their api count by 1
    return true;
  } else {
    //! If user does'nt exist create record with count 0
    return false;
  }
};

//! check if the user has exceeded their free api limit
//! return true if user can make more requests, false

export const getApiLimitCount = async () => {
  //! get the current user ID from Clerk Authentication
  const { userId } = auth();

  //! return false if no user is authenticated
  if (!userId) {
    return 0;
  }

  const userApiLimit = await prismadb.userApiLimit.findUnique({
    where: {
      userId,
    },
  });

  if (!userApiLimit) {
    return 0;
  }

  return userApiLimit.count;
};
