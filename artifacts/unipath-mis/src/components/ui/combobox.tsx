import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
  options: { value: string; label: string }[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  emptyText?: string
  allowCustom?: boolean
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  emptyText = "No option found.",
  allowCustom = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const displayValue = React.useMemo(() => {
    if (!value) return ""
    if (value.startsWith("__custom__:")) {
      return value.replace("__custom__:", "")
    }
    return options.find((o) => o.value === value)?.label || value
  }, [value, options])

  // Filter options based on search query
  const filtered = React.useMemo(() => {
    if (!search.trim()) return options
    return options.filter((o) =>
      o.label.toLowerCase().includes(search.toLowerCase())
    )
  }, [search, options])

  const showCustomOption = allowCustom && search.trim() && !options.some(
    (o) => o.label.toLowerCase() === search.trim().toLowerCase()
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal text-left"
        >
          <span className="truncate">{displayValue || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search or type custom..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {filtered.length === 0 && !showCustomOption && (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}
            <CommandGroup>
              {filtered.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onValueChange(option.value)
                    setOpen(false)
                    setSearch("")
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
              
              {showCustomOption && (
                <CommandItem
                  value={`__custom__:${search}`}
                  onSelect={() => {
                    onValueChange(`__custom__:${search}`)
                    setOpen(false)
                    setSearch("")
                  }}
                  className="font-medium text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Use custom: "{search}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
