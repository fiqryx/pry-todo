'use client'
import React from "react"
import { camelCaseToText, cn } from "@/lib/utils"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "./scroll-area"

import {
    Column,
    ColumnDef,
    Table as TanStackTable
} from "@tanstack/react-table"
import {
    CirclePlus,
    ArrowDownIcon,
    ArrowUpIcon,
    ArrowDownUpIcon,
    EyeOffIcon,
    ChevronsLeftIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsRightIcon,
    SlidersHorizontal,
} from "lucide-react"
import {
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"


interface DataTableContextValue {
    table: TanStackTable<any>
    hideSelectedRows?: boolean
}

const TABLE_PREFS_KEY = 'table-preferences';

const DataTableContext = React.createContext<DataTableContextValue | undefined>(undefined)

const useDataTableContext = () => {
    const context = React.useContext(DataTableContext)
    if (!context) {
        throw new Error("Component must be used within a DataTable provider.")
    }
    return context
}

const saveTablePreferences = (tableId: string, prefs: TablePreferences) => {
    if (typeof window !== 'undefined') {
        const allPrefs = JSON.parse(localStorage.getItem(TABLE_PREFS_KEY) || '{}');
        allPrefs[tableId] = prefs;
        localStorage.setItem(TABLE_PREFS_KEY, JSON.stringify(allPrefs));
    }
};

const loadTablePreferences = (tableId: string): TablePreferences => {
    if (typeof window !== 'undefined') {
        const allPrefs = JSON.parse(localStorage.getItem(TABLE_PREFS_KEY) || '{}');
        return allPrefs[tableId] || { columnSizes: {}, columnVisibility: {} };
    }
    return { columnSizes: {}, columnVisibility: {} };
};

export interface PaginationOptions {
    pageSize: number
    pageIndex: number
    pageSizeOptions?: number[]
}

export interface DataTableClassNames {
    wrapper?: string
    table?: string
    header?: string
    headerRow?: string
    headerCell?: string
    body?: string
    bodyRow?: string
    bodyCell?: string
    placeholder?: string
}

export type IsPlainObject<T> = T extends object ? T extends any[] ? false
    : T extends Date ? false : T extends (...args: any[]) => any ? false : true : false

export type ExtractNestedKeys<T> = {
    [K in keyof T]: IsPlainObject<T[K]> extends true
    ? `${K & string}` | `${K & string}.${ExtractNestedKeys<T[K]>}`
    : `${K & string}`;
}[keyof T];

export type TField<T> =
    | Extract<ExtractNestedKeys<T>, string>
    | { [K in keyof T]?: string };

// utils/tablePreferences.ts
type TablePreferences = {
    columnSizes: Record<string, number>;
    columnVisibility: VisibilityState;
};

export interface DataTableProps<TData, TValue> extends
    React.HTMLAttributes<HTMLDivElement> {
    tableId?: string;
    data: TData[]
    columns: ColumnDef<TData, TValue>[]
    pagination?: boolean,
    paginationOptions?: PaginationOptions,
    hideHeader?: boolean
    columnControl?: boolean
    filter?: TField<TData>[]
    hideColumns?: Extract<ExtractNestedKeys<TData>, string>[]
    hideSelectedRows?: boolean
    classNames?: DataTableClassNames
    resizeable?: boolean
    defaultColumnSize?: number;
    minColumnSize?: number;
    maxColumnSize?: number;
    suppressWidth?: boolean
    placeholder?: React.ReactNode
    width?: number
    height?: number
}


const DataTable = React.forwardRef<HTMLDivElement, DataTableProps<any, any>>(
    ({
        tableId,
        data,
        filter,
        columns,
        columnControl,
        pagination,
        paginationOptions,
        hideHeader,
        hideColumns,
        hideSelectedRows,
        className,
        classNames,
        resizeable,
        defaultColumnSize = 150,
        minColumnSize = 40,
        maxColumnSize = 800,
        suppressWidth,
        placeholder,
        width,
        height,
        ...props
    }, ref) => {
        const [rowSelection, setRowSelection] = React.useState({});
        const [sorting, setSorting] = React.useState<SortingState>([]);
        const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
        const [prefs, setPrefs] = React.useState<TablePreferences>(() => {
            const loaded = loadTablePreferences(tableId || 'default');
            return {
                columnSizes: loaded.columnSizes,
                columnVisibility: {
                    ...(hideColumns?.reduce((acc, name) => ({ ...acc, [name]: false }), {}) || {}),
                    ...loaded.columnVisibility,
                }
            };
        });

        const table = useReactTable({
            data,
            columns,
            columnResizeMode: 'onChange',
            onSortingChange: setSorting,
            onColumnFiltersChange: setColumnFilters,
            getCoreRowModel: getCoreRowModel(),
            getPaginationRowModel: getPaginationRowModel(),
            getSortedRowModel: getSortedRowModel(),
            getFilteredRowModel: getFilteredRowModel(),
            onRowSelectionChange: setRowSelection,
            onColumnVisibilityChange: (updater) => {
                const visibility = typeof updater === 'function' ? updater(prefs.columnVisibility) : updater;
                const newPrefs = { ...prefs, columnVisibility: visibility };
                setPrefs(newPrefs);
                if (tableId) saveTablePreferences(tableId, newPrefs);
            },
            onColumnSizingChange: (updater) => {
                const newSizing = typeof updater === 'function' ? updater(prefs.columnSizes) : updater;
                const newPrefs = { ...prefs, columnSizes: newSizing }
                setPrefs(newPrefs);
                if (tableId) saveTablePreferences(tableId, newPrefs);
            },
            defaultColumn: {
                minSize: defaultColumnSize,
                size: minColumnSize,
                maxSize: maxColumnSize,
            },
            state: {
                sorting,
                columnFilters,
                columnVisibility: prefs.columnVisibility,
                rowSelection,
                columnSizing: prefs.columnSizes,
                ...(paginationOptions ? { pagination: paginationOptions } : {})
            },
        });

        // eslint-disable-next-line
        const handleResetPreferences = () => {
            table.resetColumnSizing();
            table.resetColumnVisibility();
            const newPrefs = { columnSizes: {}, columnVisibility: {} };
            setPrefs(newPrefs);
            if (tableId) saveTablePreferences(tableId, newPrefs);
        };

        const columnSizeVars = React.useMemo(() => {
            const headers = table.getFlatHeaders()
            const colSizes: { [key: string]: number } = {}
            for (let i = 0; i < headers.length; i++) {
                const header = headers[i]!
                colSizes[`--header-${header.id}-size`] = header.getSize()
                colSizes[`--col-${header.column.id}-size`] = header.column.getSize()
            }
            return colSizes
        }, [table.getState().columnSizingInfo, table.getState().columnSizing]);

        React.useEffect(() => {
            if (!pagination) {
                table.setPageSize(data.length);
            } else if (paginationOptions) {
                table.setPageSize(paginationOptions.pageSize);
            }
        }, [pagination, data.length, paginationOptions?.pageSize]);

        return (
            <div
                ref={ref}
                {...props}
                style={{ maxWidth: `${width}px` }}
                className={cn('grid w-full rounded-md border', className)}
            >
                <DataTableContext.Provider value={{ table, hideSelectedRows }}>
                    {(filter || columnControl) && (
                        <div
                            className={cn(
                                'flex w-full border-b p-2 gap-2 z-1',
                                classNames?.header?.split(' ').filter((v) => v.startsWith('bg-')).join(' ')
                            )}
                        >
                            {filter && <DataTableFilterBar filter={filter} columnFilters={columnFilters} />}
                            {columnControl && (
                                <DataTableColumnControl
                                    size="icon"
                                    variant="outline"
                                    className="ml-auto rounded-md size-8"
                                >
                                    <SlidersHorizontal />
                                </DataTableColumnControl>
                            )}
                        </div>
                    )}
                    <ScrollArea>
                        <div
                            style={{ maxHeight: `${height}px` }}
                            className={cn('block', classNames?.wrapper)}
                        >
                            <table
                                className={cn(
                                    'w-full caption-bottom text-sm',
                                    suppressWidth && 'min-w-full',
                                    classNames?.table
                                )}
                                style={resizeable ? {
                                    ...columnSizeVars,
                                    width: table.getTotalSize(),
                                } : {}}
                            >
                                {!hideHeader && (
                                    <TableHeader className={cn('sticky top-0 z-[1] shadow-sm', classNames?.header)}>
                                        {table.getHeaderGroups().map((headerGroup) => (
                                            <TableRow key={headerGroup.id} className={cn('hover:bg-transparent', classNames?.headerRow)}>
                                                {headerGroup.headers.map((header) => {
                                                    return (
                                                        <TableHead
                                                            key={header.id}
                                                            colSpan={header.colSpan}
                                                            style={{ width: `calc(var(--header-${header.id}-size) * 1px)` }}
                                                            className={cn(
                                                                'relative select-none overflow-visible',
                                                                classNames?.headerCell
                                                            )}
                                                        >
                                                            {header.isPlaceholder
                                                                ? null
                                                                : flexRender(
                                                                    header.column.columnDef.header,
                                                                    header.getContext()
                                                                )}
                                                            {resizeable && header.column.getCanResize() && (
                                                                <div
                                                                    onMouseDown={header.getResizeHandler()}
                                                                    onTouchStart={header.getResizeHandler()}
                                                                    onDoubleClick={() => {
                                                                        header.column.resetSize();
                                                                        if (tableId) {
                                                                            const newPrefs = { ...prefs };
                                                                            delete newPrefs.columnSizes[header.id];
                                                                            if (tableId) saveTablePreferences(tableId, newPrefs);
                                                                        }
                                                                    }}
                                                                    className={cn(
                                                                        'absolute right-0 top-0 h-full w-[3px] bg-neutral-200 dark:bg-neutral-700 cursor-col-resize select-none touch-none',
                                                                        'hover:bg-blue-500 active:bg-blue-600',
                                                                        header.column.getIsResizing() && 'bg-blue-600'
                                                                    )}
                                                                />
                                                            )}
                                                        </TableHead>
                                                    )
                                                })}
                                            </TableRow>
                                        ))}
                                    </TableHeader>
                                )}
                                <TableBody className={cn('', classNames?.body)}>
                                    {table.getRowModel().rows?.length ? (
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                className={classNames?.bodyRow}
                                                data-state={row.getIsSelected() && "selected"}
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell
                                                        key={cell.id}
                                                        className={classNames?.bodyCell}
                                                        style={{
                                                            width: `calc(var(--header-${cell.column.id}-size) * 1px)`,
                                                        }}
                                                    >
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className={classNames?.bodyRow}>
                                            <TableCell
                                                colSpan={columns.length}
                                                className={cn(
                                                    'h-24 text-center content-center text-muted-foreground',
                                                    classNames?.placeholder
                                                )}
                                            >
                                                {placeholder ?? 'No results'}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </table>
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                    {pagination && (
                        <DataTablePagination pageSizeOptions={paginationOptions?.pageSizeOptions} />
                    )}
                </DataTableContext.Provider>
            </div>
        )
    }
) as <TData, TValue>(props: DataTableProps<TData, TValue> & {
    ref?: React.Ref<HTMLDivElement>
}) => React.JSX.Element
(DataTable as React.FC).displayName = 'DataTable';

export interface DataTableFilterBarProps<TData> {
    filter?: TField<TData>[];
    columnFilters: ColumnFiltersState;
}

export function DataTableFilterBar<TData>({
    filter,
    columnFilters,
}: DataTableFilterBarProps<TData>) {
    const { table } = useDataTableContext()

    if (!filter) return null;

    return (
        <div className="flex items-center flex-wrap gap-2">
            {filter.map((item, idx) => {
                const [filterKey, label] = typeof item === 'string'
                    ? [item, undefined]
                    : [Object.keys(item)[0], Object.values(item)[0]];

                return (
                    <DataTableFilter
                        key={idx}
                        size="sm"
                        filter={filterKey}
                        label={label as string}
                        variant="outline"
                    />
                );
            })}
            {columnFilters.length > 0 && (
                <Button
                    size="sm"
                    variant="ghost-primary"
                    onClick={() => table.resetColumnFilters()}
                >
                    Clear filters
                </Button>
            )}
        </div>
    );
}


export interface DataTableFilter extends
    React.ComponentProps<typeof Button> {
    filter: string
    label?: string
}

const DataTableFilter = React.forwardRef<HTMLButtonElement, DataTableFilter>(
    ({ filter, label, ...props }, ref) => {
        const { table } = useDataTableContext()
        const column = table.getColumn(filter)
        const labelName = React.useMemo(() => {
            return label ?? camelCaseToText(filter).replaceAll('.', ' ')
        }, [label])

        if (!column) {
            return null
        }

        const [open, setOpen] = React.useState(false)
        const currentFilter = column.getFilterValue() as string;
        const [filterValues, setFilterValues] = React.useState<string>()

        return (
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <Button ref={ref} {...props}>
                        <CirclePlus className="size-4" />
                        {label} {currentFilter ? `: ${currentFilter}` : ""}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="p-4">
                    <form
                        className="grid w-full max-w-sm items-center gap-2"
                        onSubmit={(e) => {
                            e.preventDefault()
                            column.setFilterValue(filterValues)
                            setOpen(false)
                        }}
                    >
                        <Label htmlFor={filter}>
                            Filter {labelName}
                        </Label>
                        <Input
                            id={filter}
                            value={filterValues ?? ""}
                            onChange={(e) => setFilterValues(e.target.value)}
                        />
                        <Button type="submit" size="sm">
                            Apply
                        </Button>
                    </form>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }
)
DataTableFilter.displayName = 'DataTableFilter';


const DataTableColumnControl = React.forwardRef<
    HTMLButtonElement,
    React.ComponentProps<typeof Button>
>(
    (props, ref) => {
        const { table } = useDataTableContext()

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button ref={ref} {...props} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {table
                        .getAllColumns()
                        .filter((column) => column.getCanHide())
                        .map((column) => {
                            return (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    className={cn(
                                        !(column.columnDef.meta as any)?.columnName && 'capitalize'
                                    )}
                                    checked={column.getIsVisible()}
                                    onCheckedChange={(value) =>
                                        column.toggleVisibility(!!value)
                                    }
                                >
                                    {(column.columnDef.meta as any)?.columnName || column.id}
                                </DropdownMenuCheckboxItem>
                            )
                        })}
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }
)
DataTableColumnControl.displayName = 'DataTableColumnControl';

export interface DataTableColumnHeaderProps<TData, TValue>
    extends React.HTMLAttributes<HTMLDivElement> {
    column: Column<TData, TValue>
    title: string
}

const DataTableColumnHeader = React.forwardRef<HTMLDivElement, DataTableColumnHeaderProps<any, any>>(
    ({
        column,
        title,
        className,
        ...props
    }, ref) => {
        if (!column.getCanSort()) {
            return <div {...props} className={cn(className)}>{title}</div>
        }

        return (
            <div
                ref={ref}
                {...props}
                className={cn(
                    "flex items-center gap-2",
                    className
                )}
            >
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 data-[state=open]:bg-accent"
                        >
                            {title}
                            {column.getIsSorted() === "desc" ? (
                                <ArrowDownIcon className="ml-2 size-4" />
                            ) : column.getIsSorted() === "asc" ? (
                                <ArrowUpIcon className="ml-2 size-4" />
                            ) : (
                                <ArrowDownUpIcon className="ml-2 size-4" />
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                            <ArrowUpIcon className="mr-2 size-3.5 text-muted-foreground/70" />
                            Asc
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                            <ArrowDownIcon className="mr-2 size-3.5 text-muted-foreground/70" />
                            Desc
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                            <EyeOffIcon className="mr-2 size-3.5 text-muted-foreground/70" />
                            Hide
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        )
    }
) as <TData, TValue>(props: DataTableColumnHeaderProps<TData, TValue> & {
    ref?: React.Ref<HTMLDivElement>
}) => React.JSX.Element
(DataTableColumnHeader as React.FC).displayName = 'DataTableColumnHeader';


export interface DataTablePaginationProps extends
    React.HTMLAttributes<HTMLDivElement> {
    pageSizeOptions?: number[]
}

const DataTablePagination = React.forwardRef<HTMLDivElement, DataTablePaginationProps>(
    ({
        pageSizeOptions = [10, 20, 50],
        className,
        ...props
    }, ref) => {
        const { table, hideSelectedRows } = useDataTableContext()

        return (
            <div
                ref={ref}
                {...props}
                className={cn(
                    'flex items-center flex-wrap p-2 gap-2',
                    hideSelectedRows ? 'justify-end' : 'justify-between',
                    className
                )}
            >
                {!hideSelectedRows && (
                    <div className="flex-1 text-sm text-muted-foreground">
                        {`${table.getFilteredSelectedRowModel().rows.length} of ${table.getFilteredRowModel().rows.length} row(s) selected`}
                    </div>
                )}
                <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">
                            Rows per page
                        </p>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={(value) => {
                                table.setPageSize(Number(value))
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={table.getState().pagination.pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {pageSizeOptions.map((item) => (
                                    <SelectItem key={item} value={`${item}`}>
                                        {item}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        {`Page ${table.getState().pagination.pageIndex + 1} of ${table.getPageCount()}`}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">
                                Go to first page
                            </span>
                            <ChevronsLeftIcon className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">
                                Go to prev page
                            </span>
                            <ChevronLeftIcon className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">
                                Go to next page
                            </span>
                            <ChevronRightIcon className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">
                                Go to last page
                            </span>
                            <ChevronsRightIcon className="size-4" />
                        </Button>
                    </div>
                </div>
            </div>
        )
    }
)
DataTablePagination.displayName = 'DataTablePagination';

// eslint-disable-next-line
function _renderChildren<T = any>(
    children: React.ReactNode,
    ...displayName: string[]
): { child: React.ReactElement; props: T }[] {
    const results: { child: React.ReactElement; props: T }[] = [];

    React.Children.forEach(children, (child) => {

        if (React.isValidElement(child)) {
            const name = (child.type as React.ComponentType)?.displayName;
            console.log(child.type);

            if (name && displayName.includes(name)) {
                results.push({
                    child,
                    props: child.props as T,
                });
            }
        }
    });

    return results;
}

export {
    DataTable,
    DataTableFilter,
    DataTableColumnControl,
    DataTableColumnHeader,
    DataTablePagination,
}