
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // Create a local ref if none is provided
    const inputRef = React.useRef<HTMLInputElement>(null);
    const combinedRef = ref || inputRef;
    
    // Restore focus after render if input had focus before
    React.useEffect(() => {
      // Using a ref to track if this component had focus
      const hasFocus = document.activeElement === 
        (combinedRef as React.RefObject<HTMLInputElement>).current;
      
      if (hasFocus) {
        setTimeout(() => {
          const input = (combinedRef as React.RefObject<HTMLInputElement>).current;
          if (input) {
            const length = input.value.length;
            input.focus();
            // Restore cursor position to end
            input.setSelectionRange(length, length);
          }
        }, 0);
      }
    });
    
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={combinedRef}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
