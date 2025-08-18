import React, { useState, useEffect, useRef, ReactNode, isValidElement, Children } from "react";
import { Search } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./select";

interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  children: React.ReactNode;
  searchPlaceholder?: string;
}

export function SearchableSelect({
  value,
  onValueChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  children,
}: SearchableSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredChildren, setFilteredChildren] = useState<ReactNode[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Focus the search input when dropdown opens
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredChildren(Children.toArray(children));
      return;
    }

    const filtered = Children.toArray(children).filter((child) => {
      // Only filter SelectItem components, keep other elements like dividers
      if (!isValidElement(child)) return true;
      
      // If it's not a SelectItem (like div separators), keep it
      if (child.type !== SelectItem) return true;
      
      // Skip disabled header items from search
      if (child.props.disabled) return false;
      
      // Get text content from children or value
      const childText = (child.props.children?.toString() || child.props.value || "").toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      return childText.includes(searchLower);
    });

    setFilteredChildren(filtered);
  }, [searchTerm, children]);

  return (
    <Select 
      value={value} 
      onValueChange={(val) => {
        onValueChange(val);
        setSearchTerm(""); // Reset search term when a value is selected
        setIsOpen(false); // Close dropdown after selection
      }}
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setSearchTerm(""); // Clear search when closing
        }
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[400px] w-full min-w-[var(--radix-select-trigger-width)]">
        <div className="px-3 py-2 sticky top-0 bg-white z-20 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                // Prevent all keyboard events from bubbling up except Escape
                if (e.key !== 'Escape') {
                  e.stopPropagation();
                }
                // Prevent arrow keys from navigating the select options while typing
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            />
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-1">
          {filteredChildren.length > 0 ? (
            filteredChildren
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
              No matching options found
            </div>
          )}
        </div>
      </SelectContent>
    </Select>
  );
}
