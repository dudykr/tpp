"use client";

import dynamic from "next/dynamic";
import React from "react";

const NoSSRInner = ({ children }: { children: React.ReactNode }) => (
  <React.Fragment>{children}</React.Fragment>
);

export const NoSSR = dynamic(() => Promise.resolve(NoSSRInner), {
  ssr: false,
});
