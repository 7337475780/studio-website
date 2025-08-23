import Services from "@/components/ServiceCard";
import { services } from "@/lib/data";
import React from "react";

const page = () => {
  return (
    <div>
      <Services services={services} />
    </div>
  );
};

export default page;
