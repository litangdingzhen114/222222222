import { Alert, App, Button, Card, Input, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type Key } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchExportBlob, listBookings, updateBulkStatus, updateRecordStatus } from '../api';
import type { BookingRecord } from '../types';
import { bookingStatusOptions } from '../types';
import { canTransitionStatus, downloadBlob, formatDate, maskContact, nextStatusOptions } from '../utils';
import { RecordDetailDrawer } from './RecordDetailDrawer';

const pageSize = 10;

export function BookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [detail, setDetail] = useState<BookingRecord | null>(null);
  const [bulkStatus, setBulkStatus] = useState('confirmed');
  const [bulkNote, setBulkNote] = useState('');
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const page = Number(searchParams.get('page') || 1);
  const status = searchParams.get('status') || '';
  const q = searchParams.get('q') || '';

  const query = useQuery({
    queryKey: ['bookings', { page, status, q }],
    queryFn: () => listBookings({ page, pageSize, status, q })
  });

  const selectedRecords = useMemo(
    () => (query.data?.items || []).filter((item) => selectedRowKeys.includes(item.id)),
    [query.data?.items, selectedRowKeys]
  );
  const bulkStatusOptions = useMemo(
    () => bookingStatusOptions.filter((option) => option.value && selectedRecords.every((record) => canTransitionStatus('bookings', record.status, option.value))),
    [selectedRecords]
  );
  const activeBulkStatus = bulkStatusOptions.some((option) => option.value === bulkStatus)
    ? bulkStatus
    : (bulkStatusOptions[0]?.value || '');

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus, note }: { id: string; nextStatus: string; note?: string }) =>
      updateRecordStatus('bookings', id, { status: nextStatus, note }),
    onSuccess: async () => {
      message.success('预约状态已更新');
      setDetail(null);
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      await queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '状态更新失败')
  });

  const bulkMutation = useMutation({
    mutationFn: () => updateBulkStatus('bookings', {
      ids: selectedRowKeys.map(String),
      status: activeBulkStatus,
      note: bulkNote
    }),
    onSuccess: async (result) => {
      message.success(`已处理 ${result.updated} 条预约`);
      setSelectedRowKeys([]);
      setBulkNote('');
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      await queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '批量处理失败')
  });

  const setParam = (key: string, value: string | number) => {
    const next = new URLSearchParams(searchParams);
    if (value === '') next.delete(key);
    else next.set(key, String(value));
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const columns = useMemo<ColumnsType<BookingRecord>>(() => [
    {
      title: '服务',
      dataIndex: 'service',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <strong>{record.service || '-'}</strong>
          <span className="table-subtle">{formatDate(record.createdAt)}</span>
        </Space>
      )
    },
    { title: '日期', dataIndex: 'date', width: 130 },
    { title: '人数', dataIndex: 'people', width: 90 },
    { title: '联系方式', dataIndex: 'contact', render: (value) => maskContact(value), width: 150 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 150,
      render: (value, record) => (
        <Select
          value={value || 'new'}
          options={nextStatusOptions('bookings', value, bookingStatusOptions)}
          size="small"
          disabled={nextStatusOptions('bookings', value, bookingStatusOptions).length <= 1}
          onChange={(nextStatus) => statusMutation.mutate({ id: record.id, nextStatus })}
        />
      )
    },
    {
      title: '操作',
      width: 110,
      render: (_, record) => <Button type="link" onClick={() => setDetail(record)}>详情</Button>
    }
  ], [statusMutation]);

  const exportData = async () => {
    const blob = await fetchExportBlob('bookings');
    downloadBlob(blob, 'hailin-bookings.csv');
    message.success('预约 CSV 已导出');
  };

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card>
        <Space wrap className="toolbar">
          <Select
            value={status}
            options={bookingStatusOptions}
            onChange={(value) => setParam('status', value)}
            className="status-filter"
          />
          <Input.Search
            allowClear
            defaultValue={q}
            placeholder="搜索服务、日期、联系方式或备注"
            onSearch={(value) => setParam('q', value.trim())}
            className="search-box"
          />
          <Button onClick={exportData}>导出 CSV</Button>
        </Space>
      </Card>

      {selectedRowKeys.length > 0 && (
        <Card className="bulk-card">
          <Space wrap>
            <Tag color="blue">已选择 {selectedRowKeys.length} 条</Tag>
            {bulkStatusOptions.length > 0 ? (
              <Select value={activeBulkStatus} options={bulkStatusOptions} onChange={setBulkStatus} className="status-filter" />
            ) : (
              <Alert type="warning" showIcon message="所选预约没有共同可流转状态" />
            )}
            <Input value={bulkNote} onChange={(event) => setBulkNote(event.target.value)} placeholder="批量处理备注" className="note-input" />
            <Button type="primary" disabled={!activeBulkStatus} loading={bulkMutation.isPending} onClick={() => bulkMutation.mutate()}>批量处理</Button>
            <Button onClick={() => setSelectedRowKeys([])}>取消选择</Button>
          </Space>
        </Card>
      )}

      <Card>
        <Table
          rowKey="id"
          loading={query.isLoading}
          dataSource={query.data?.items || []}
          columns={columns}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{
            current: page,
            pageSize,
            total: query.data?.total || 0,
            showSizeChanger: false,
            onChange: (nextPage) => setParam('page', nextPage)
          }}
        />
      </Card>

      <RecordDetailDrawer
        kind="bookings"
        open={Boolean(detail)}
        record={detail}
        statusOptions={bookingStatusOptions}
        saving={statusMutation.isPending}
        onClose={() => setDetail(null)}
        onSave={(payload) => detail && statusMutation.mutate({ id: detail.id, nextStatus: payload.status, note: payload.note })}
      />
    </Space>
  );
}
