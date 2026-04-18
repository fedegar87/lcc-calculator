"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ChartDataTableProps {
  caption: string;
  columns: string[];
  rows: Array<Record<string, string | number>>;
}

export function ChartDataTable({
  caption,
  columns,
  rows,
}: ChartDataTableProps) {
  return (
    <div className="mt-4 rounded-xl border">
      <Table>
        <caption className="border-b px-4 py-3 text-left text-sm font-medium caption-top">
          {caption}
        </caption>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column} scope="col">
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={`${caption}-${index}`}>
              {columns.map((column) => (
                <TableCell key={column}>{row[column]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
