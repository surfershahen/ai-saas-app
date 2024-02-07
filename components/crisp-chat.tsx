"use client";

import { useEffect } from "react";
import { Crisp } from "crisp-sdk-web";

export const CrispChat = () => {
  useEffect(() => {
    Crisp.configure("e6bea70a-c4f7-49f2-98b6-e477d6b27656");
  }, []);

  return null;
};
