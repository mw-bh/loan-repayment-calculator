import { memo } from 'react';
import type { ScheduleRow } from '../utils/loan';
import { formatCurrency } from '../utils/format';
import { Table, TableContainer, Td, Th, Tr } from './Table';

interface AmortisationTableProps {
  schedule: ScheduleRow[];
}

/**
 * Up to 360 rows × 6 cells. Rendered in full inside a scroll container rather
 * than virtualised: ~2,000 cells is well within what React handles smoothly,
 * and it keeps native find-in-page, printing and screen-reader navigation.
 */
export const AmortisationTable = memo(function AmortisationTable({
  schedule,
}: AmortisationTableProps) {
  return (
    <TableContainer label="Schedule table, scrollable">
      <Table caption={`Repayment schedule over ${schedule.length} months`}>
        <thead>
          <tr>
            <Th>Month</Th>
            <Th align="right">Opening balance</Th>
            <Th align="right">Payment</Th>
            <Th align="right">Interest</Th>
            <Th align="right">Principal</Th>
            <Th align="right">Closing balance</Th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((row) => (
            <Tr key={row.month}>
              <Td>{row.month}</Td>
              <Td align="right">{formatCurrency(row.openingBalance)}</Td>
              <Td align="right">{formatCurrency(row.payment)}</Td>
              <Td align="right">{formatCurrency(row.interest)}</Td>
              <Td align="right">{formatCurrency(row.principal)}</Td>
              <Td align="right">{formatCurrency(row.closingBalance)}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableContainer>
  );
});
