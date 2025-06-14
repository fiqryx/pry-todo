'use client'
import { useIssueContext } from "./backlog-details";
import { DataTable } from "@/components/ui/data-table";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useGroup, useLayout } from "../use-layout"
import { useProject } from "@/stores/project";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { IssueChildHydrator } from "./backlog-hydrator";
import { Issue } from "@/types/schemas/issue";
import { Input } from "@/components/ui/input";

import { ISSUE_MAPS } from "@/types/internal";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "@radix-ui/react-icons";
import { Calendar } from "@/components/ui/calendar";
import { Translate, translateText } from "@/components/translate";
import { IssueItem } from "@/types/schemas/issue-item";
import { useIssues, useIssueChilds } from "../use-issue";
import { getIssueColorClass } from '@/lib/internal';
import { IssueFormDialog } from "@/components/issue-dialog";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMemo, useState, Children, useCallback, ComponentProps } from "react";
import { BanIcon, LucideIcon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { columns, tableConfig, columnChilds, columnDetails, tableChildConfig } from "./backlog-columns";

export function BacklogTable() {
    const { t } = useTranslation();

    const [issues] = useIssues();
    const [layout] = useLayout();

    if (layout === 'group') {
        return <BacklogTableGroup />
    }

    return (
        <DataTable
            resizeable
            suppressWidth
            columnControl
            hideSelectedRows
            data={issues}
            columns={columns}
            height={672}
            hideColumns={['startDate', 'dueDate']}
            tableId="backlog-table"
            classNames={tableConfig}
            filter={[
                { title: translateText(t, 'name', { capitalize: true }) },
                { priority: translateText(t, 'priority', { capitalize: true }) },
                { status: translateText(t, 'status', { capitalize: true }) },
            ]}
        />
    )
}

export function BacklogTableGroup({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    const [issues] = useIssues();
    const [group] = useGroup();

    const groups = useMemo(() => {
        const groups = Object.fromEntries(
            Object.keys(ISSUE_MAPS[group]).map(type => [type, [] as Issue[]])
        );

        issues.forEach(issue => {
            const type = issue[group];
            groups[type]?.push(issue);
        });

        Object.values(groups).forEach(group => {
            group.sort((a, b) => a.order - b.order);
        });

        return groups;
    }, [issues, group]);

    if (!issues.length) {
        return (
            <DataTable
                resizeable
                suppressWidth
                columnControl
                data={issues}
                hideSelectedRows
                columns={columns}
                tableId="backlog-table"
                classNames={tableConfig}
                hideColumns={['startDate', 'dueDate']}
            />
        )
    }

    return (
        <div
            {...props}
            className={cn('grid gap-5 auto-rows-min', className)}
        >
            {Object.entries(groups).map(([type, issues], idx) => {
                const Icon = (ISSUE_MAPS[group] as any)[type] as LucideIcon;
                return !!issues.length && (
                    <div key={idx} className="grid gap-2">
                        <h6 className="text-sm font-medium flex items-center gap-1">
                            <Icon className={cn('size-5', getIssueColorClass(type as 'todo'))} />
                            <span className="capitalize">
                                {type.replace('_', ' ').replace(/^./, char => char.toUpperCase())}
                            </span>
                            <span className="text-sm text-muted-foreground ml-0.5">
                                ({issues.length})
                            </span>
                        </h6>
                        <DataTable
                            resizeable
                            suppressWidth
                            columnControl
                            data={issues}
                            height={300}
                            hideSelectedRows
                            columns={columns}
                            classNames={tableConfig}
                            hideColumns={['startDate', 'dueDate']}
                            tableId={`backlog-${type}-table-group`}
                        />
                    </div>
                )
            })}
        </div>
    )
}

export function BacklogDetailTable({
    className,
    ...props
}: ComponentProps<'div'>) {
    const { t } = useTranslation();
    const issue = useIssueContext();

    return (
        <div
            {...props}
            className={cn('rounded-md border', className)}
        >
            <Table className="text-xs">
                <TableBody>
                    {columnDetails.map(({ label, children, render }, idx) => (render?.(issue) ?? true) && (
                        <TableRow key={idx}>
                            <TableCell className="content-center text-muted-foreground w-20 sm:w-40">
                                <Translate t={t} capitalize value={label.toLowerCase().replaceAll(' ', '.')} />
                            </TableCell>
                            <TableCell>
                                {typeof children === 'function' ? children(issue) : children}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export function BacklogChildTable({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    const issue = useIssueContext();
    const { t } = useTranslation();
    const { active, checkPermission } = useProject();
    const [issueChilds, setIssueChilds] = useIssueChilds();

    const [isLoading, setIsLoading] = useState(false);
    const levelAdmin = useMemo(() => checkPermission('admin'), [active]);

    const completionPercent = useMemo(
        () => {
            if (!issueChilds?.length) return 0;

            const doneCount = issueChilds.filter(child => child.status === 'done').length;
            const totalCount = issueChilds.length;

            return Math.round((doneCount / totalCount) * 100);
        },
        [issueChilds]
    );

    const handleSave = useCallback((issue: Issue) => {
        setIssueChilds((prev) =>
            prev.some(v => v.id === issue.id)
                ? prev.map(t => t.id === issue.id ? issue : t)
                : [...prev, issue]
        );
    }, [setIssueChilds]);

    return (
        <IssueChildHydrator issueId={issue.id} onLoading={setIsLoading}>
            <div
                {...props}
                className={cn('flex flex-col gap-1 w-full max-w-[17.2rem] sm:max-w-full', className)}
            >
                {levelAdmin && (
                    <IssueFormDialog
                        parentId={issue.id}
                        onSave={handleSave}
                        disabled={!levelAdmin}
                        excludeType={['task']}
                        defaultType="subtask"
                    >
                        <Button
                            size="sm"
                            variant="outline"
                            className="w-fit"
                            disabled={isLoading}
                        >
                            <PlusIcon />&nbsp;
                            <Translate t={t} capitalize value="add" />
                        </Button>
                    </IssueFormDialog>
                )}

                {isLoading ? <Skeleton className="h-2 w-full rounded-full my-2" /> : issueChilds.length > 0 && (
                    <div className="flex items-center gap-4 sm:gap-6 w-full pr-2">
                        <Progress value={completionPercent} variant="success" className="my-2" />
                        <span className="text-xs sm:text-sm text-muted-foreground text-nowrap">
                            {completionPercent}%&nbsp;
                            <Translate t={t} capitalize value="done" />
                        </span>
                    </div>
                )}

                <div className="rounded-md border min-w-0 max-w-sm sm:max-w-[471px]">
                    <DataTable
                        resizeable
                        suppressWidth
                        columnControl
                        data={issueChilds}
                        hideSelectedRows
                        columns={columnChilds}
                        maxColumnSize={300}
                        tableId="backlog.child.table"
                        className="border-none"
                        classNames={tableChildConfig}
                        placeholder={
                            <EmptyTable>
                                {isLoading ? [
                                    <Skeleton key="1" className="h-4 rounded-sm" />,
                                    <Skeleton key="2" className="h-4 rounded-sm" />,
                                    <Skeleton key="3" className="h-4 rounded-sm" />,
                                ] : <Translate t={t} capitalize value="no.items" />}
                            </EmptyTable>
                        }
                    />
                </div>
            </div>
        </IssueChildHydrator>
    )
}

interface IssueChildTableProps extends
    React.ComponentProps<typeof Table> {
    records?: Partial<Issue>[]
    onSave?: (updates: Partial<Issue>, index: number) => void
    onUpdate: (updates: Partial<Issue>, index?: number) => void
    onRemove?: (id: string | number) => void
}

// eslint-disable-next-line
function WriteTaskTable({
    onSave,
    onUpdate,
    onRemove,
    records = [],
    ...props
}: IssueChildTableProps) {
    return (
        <Table {...props}>
            <TableBody>
                {records.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-transparent">
                        <TableCell colSpan={2}>
                            <Input
                                max={60}
                                defaultValue={item.title}
                                placeholder="What needs to be done?"
                                className="outline-none focus-visible:ring-1 rounded-sm shadow-none p-1"
                                onChange={(e) => onUpdate({ title: e.target.value }, idx)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        onUpdate({ title: e.currentTarget.value }, idx);
                                        if (onSave) onSave(item, idx)
                                    }
                                }}
                            />
                        </TableCell>

                        {/* <TableCell>
                            <IssuePriorityDropdown
                                value={item as Issue}
                                onValueChange={(issue) => onUpdate(issue, idx)}
                            />
                        </TableCell> */}

                        <TableCell>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "xmax-w-xs pl-3 text-left font-normal w-full rounded-sm",
                                            !item.dueDate && "text-muted-foreground"
                                        )}
                                    >
                                        {item.dueDate ? format(item.dueDate, "LLL dd, y") : 'Due date'}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                        mode="single"
                                        selected={item.dueDate ?? undefined}
                                        month={item.dueDate ?? undefined}
                                        onSelect={(dueDate) => {
                                            onUpdate({ dueDate }, idx);
                                            document.dispatchEvent(
                                                new KeyboardEvent('keydown', { key: 'Escape' })
                                            );
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </TableCell>
                        <TableCell className="content-center">
                            <div className="inline-flex items-center gap-1">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="size-6 rounded-sm"
                                    onClick={() => onSave && onSave(item, idx)}
                                >
                                    <SaveIcon />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="size-6 rounded-sm"
                                    onClick={() => onRemove && onRemove(idx)}
                                >
                                    <BanIcon />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

function EmptyTable({
    onClick,
    children
}: {
    onClick?: () => void
    children?: React.ReactNode
}) {
    const childrens = Children.toArray(children).filter(Boolean);

    return (
        <Table className="text-xs">
            <TableBody>
                {childrens.map((child, idx) => (
                    <TableRow
                        key={idx}
                        className={cn(childrens.length !== 1 && 'hover:bg-transparent')}
                    >
                        <TableCell
                            colSpan={6}
                            onClick={childrens.length === 1 ? onClick : undefined}
                            className={cn(
                                'text-center text-muted-foreground py-1',
                                childrens.length === 1 && 'cursor-pointer'
                            )}
                        >
                            {child}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

interface IssueItemTable extends
    React.ComponentProps<typeof Table> {
    records?: Partial<IssueItem>[]
    onSave?: (updates: Partial<IssueItem>, index: number) => void
    onUpdate: (updates: Partial<IssueItem>, index: number) => void
    onRemove?: (item: Partial<IssueItem>, id: string | number) => void
}

export function WrtieIssueItemTable({
    onSave,
    onUpdate,
    onRemove,
    records = [],
    ...props
}: IssueItemTable) {
    const { t } = useTranslation();
    return (
        <Table {...props}>
            <TableBody>
                {records.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-transparent">
                        <TableCell className="p-1">
                            <Input
                                max={60}
                                defaultValue={item.url}
                                placeholder="https://example.com"
                                className="outline-none focus-visible:ring-1 shadow-none p-1"
                                onChange={(e) => onUpdate({ url: e.target.value }, idx)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        onUpdate({ url: e.currentTarget.value }, idx);
                                        onSave?.(item, idx)
                                    }
                                }}
                            />
                        </TableCell>
                        <TableCell className="p-1">
                            <Input
                                max={60}
                                defaultValue={item.text}
                                placeholder={translateText(t, 'add.description', { capitalize: true })}
                                className="outline-none focus-visible:ring-1 shadow-none p-1"
                                onChange={(e) => onUpdate({ text: e.target.value }, idx)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        onUpdate({ text: e.currentTarget.value }, idx);
                                        onSave?.(item, idx)
                                    }
                                }}
                            />
                        </TableCell>
                        <TableCell className="p-1">
                            <div className="inline-flex items-center gap-0.5">
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="size-6"
                                    onClick={() => onSave?.(item, idx)}
                                >
                                    <SaveIcon />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="size-6"
                                    onClick={() => onRemove?.(item, idx)}
                                >
                                    <Trash2Icon />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}