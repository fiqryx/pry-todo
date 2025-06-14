'use client'
import React from "react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProjectDialog } from "@/components/project-dialog"
import { Input, InputIcon } from "@/components/ui/input"
import { useFilter, SortType, LayoutType } from "../use-filter"

import { Translate, translateText } from "@/components/translate"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Plus, ListIcon, SearchIcon, LayoutGrid, ArrowDownNarrowWide, CheckIcon } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const sortMap = {
    name: 'name',
    updatedAt: 'activity',
} as const

export function ProjectActions({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    const { t } = useTranslation();
    const [filter, setFilter] = useFilter();

    return (
        <div
            {...props}
            className={cn(
                'flex flex-wrap lg:flex-nowrap items-center justify-between w-full gap-4',
                className
            )}
        >
            <div className="flex items-center gap-2">
                <Input
                    type="search"
                    value={filter.search}
                    className="w-40 focus:w-60 duration-200 ease-in-out"
                    onChange={(e) => setFilter({ search: e.target.value })}
                    placeholder={translateText(t, 'search', { capitalize: true })}
                >
                    <InputIcon position="left">
                        <SearchIcon className="size-5" />
                    </InputIcon>
                </Input>
            </div>
            <div className="flex items-center flex-wrap gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Badge
                            variant="primary"
                            className="font-semibold py-1 px-1.5 gap-2 w-40 h-8 cursor-pointer"
                        >
                            <ArrowDownNarrowWide className="size-5" />
                            <Translate t={t} capitalize value="sort.by" className="truncate">
                                {translateText(t, sortMap[filter.sort as 'name'])}
                            </Translate>
                        </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40">
                        {Object.entries(sortMap).map(([key, value], idx) => (
                            <DropdownMenuItem
                                key={idx}
                                onClick={() => setFilter({ sort: key as SortType })}
                                className="text-xs focus:text-primary focus:bg-primary/40"
                            >
                                <Translate t={t} capitalize value={value} />
                                {filter.sort === key && <CheckIcon className="size-5 ml-auto" />}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <ToggleGroup
                    size="sm"
                    type="single"
                    value={filter.layout}
                    className="hidden sm:flex border rounded-sm h-8"
                    onValueChange={(layout: LayoutType) => setFilter({ layout })}
                >
                    <ToggleGroupItem value="grid" className="hover:cursor-pointer">
                        <LayoutGrid className="size-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="list" className="hover:cursor-pointer">
                        <ListIcon className="size-4" />
                    </ToggleGroupItem>
                </ToggleGroup>
                <ProjectDialog>
                    <Button size="sm" variant="outline" className="rounded-sm">
                        <Plus />&nbsp;
                        {translateText(t, 'create', { capitalize: true })}
                    </Button>
                </ProjectDialog>
            </div>
        </div>
    )
}