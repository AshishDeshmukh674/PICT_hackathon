"use client";

import React, { forwardRef } from "react";
import { Root, Indicator } from "@radix-ui/react-progress";
import { cn } from "../../lib/utils";

const Progress = forwardRef(({ className, value, ...props }, ref) => {
  return (
    <Root
      ref={ref}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className)}
      {...props}
    >
      <Indicator
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </Root>
  );
});

Progress.displayName = "Progress";

export { Progress };