import * as XLSX from 'xlsx';

export function exportToExcel(data: any, fileName: string) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return;

    const workbook = XLSX.utils.book_new();

    if (Array.isArray(data.monthlyStats)) {
        const monthlySheet = XLSX.utils.json_to_sheet(
            data.monthlyStats.map((item: any) => ({
                Week: item.week,
                Income: item.income,
                Expense: item.expense,
            }))
        );
        XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Stats');
    }

    if (Array.isArray(data.categoryProportions)) {
        const categorySheet = XLSX.utils.json_to_sheet(
            data.categoryProportions.map((item: any) => ({
                Category: item.category,
                Count: item.count,
                Percentage: item.percentage,
            }))
        );
        XLSX.utils.book_append_sheet(workbook, categorySheet, 'Category Proportions');
    }

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
}