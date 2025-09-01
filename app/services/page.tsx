"use client";
import Services, { Service } from "@/components/ServiceCard";
import { supabase } from "@/lib/supabaseClient";
import React, { useEffect, useState } from "react";

const page = () => {
  return (
    <div>
      <Services />
    </div>
  );
};

export default page;
