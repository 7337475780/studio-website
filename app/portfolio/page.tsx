import Portfolio from "@/components/Portfolio";
import React from "react";
import { portfolio } from "@/lib/data";

const page = () => {
  return (
    <div>
      <Portfolio items={portfolio} />
    </div>
  );
};

export default page;
