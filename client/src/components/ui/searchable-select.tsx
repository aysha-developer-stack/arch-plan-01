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
      if (!isValidElement(child) || child.props.disabled) return false;
      const childText = child.props.children?.toString().toLowerCase() || "";
      return childText.includes(searchTerm.toLowerCase());
    });

    setFilteredChildren(filtered);
  }, [searchTerm, children]);

  return (
    <Select 
      value={value} 
      onValueChange={(val) => {
        onValueChange(val);
        setSearchTerm(""); // Reset search term when a value is selected
      }}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <div className="px-3 py-2 sticky top-0 bg-white z-10">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()} // Prevent dropdown from closing when clicking the input
              onKeyDown={(e) => e.stopPropagation()} // Prevent keyboard events from closing the dropdown
            />
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {filteredChildren.length > 0 ? (
            filteredChildren
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No matching options found
            </div>
          )}
        </div>
      </SelectContent>
    </Select>
  );
}
