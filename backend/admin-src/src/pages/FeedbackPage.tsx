import { Alert, App, Button, Card, Input, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type Key } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchExportBlob, listFeedback, updateBulkStatus, updateRecordStatus } from '../api';
import type { FeedbackRecord } from '../types';
import { feedbackStatusOptions } from '../types';
import { canTransitionStatus, downloadBlob, formatDate, maskContact, nextStatusOptions } from '../utils';
import { RecordDetailDrawer } from './RecordDetailDrawer';

const pageSize = 10;

export function FeedbackPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [detail, setDetail] = useState<FeedbackRecord | null>(null);
  const [bulkStatus, setBulkStatus] = useState('PROCESSING');
  const [bulkNote, setBulkNote] = useState('');
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const page = Number(searchParams.get('page') || 1);
  const status = searchParams.get('status') || '';
  const q = searchParams.get('q') || '';

  const query = useQuery({
    queryKey: ['feedback', { page, status, q }],
    queryFn: () => listFeedback({ page, pageSize, status, q })
  });

  const selectedRecords = useMemo(
    () => (query.data?.items || []).filter((item) => selectedRowKeys.includes(item.id)),
    [query.data?.items, selectedRowKeys]
  );
  const bulkStatusOptions = useMemo(
    () => feedbackStatusOptions.filter((option) => option.value && selectedRecords.every((record) => canTransitionStatus('feedback', record.status, option.value))),
    [selectedRecords]
  );
  const activeBulkStatus = bulkStatusOptions.some((option) => option.value === bulkStatus)
    ? bulkStatus
    : (bulkStatusOptions[0]?.value || '');

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus, note }: { id: string; nextStatus: string; note?: string }) =>
      updateRecordStatus('feedback', id, { status: nextStatus, note }),
    onSuccess: async () => {
      message.success('反馈状态已更新');
      setDetail(null);
      await queryClient.invalidateQueries({ queryKey: ['feedback'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '状态更新失败')
  });

  const bulkMutation = useMutation({
    mutationFn: () => updateBulkStatus('feedback', {
      ids: selectedRowKeys.map(String),
      status: activeBulkStatus,
      note: bulkNote
    }),
    onSuccess: async (result) => {
      message.success(`已处理 ${result.updated} 条反馈`);
      setSelectedRowKeys([]);
      setBulkNote('');
      await queryClient.invalidateQueries({ queryKey: ['feedback'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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

  const columns = useMemo<ColumnsType<FeedbackRecord>>(() => [
    {
      title: '游客',
      dataIndex: 'nickname',
      width: 160,
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <strong>{value || '游客'}</strong>
          <span className="table-subtle">{formatDate(record.createdAt)}</span>
        </Space>
      )
    },
    {
      title: '反馈内容',
      dataIndex: 'content',
      ellipsis: true
    },
    { title: '联系方式', dataIndex: 'contact', render: (value) => maskContact(value), width: 150 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 150,
      render: (value, record) => (
        <Select
          value={value || 'PENDING'}
          options={nextStatusOptions('feedback', value, feedbackStatusOptions)}
          size="small"
          disabled={nextStatusOptions('feedback', value, feedbackStatusOptions).length <= 1}
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
    const blob = await fetchExportBlob('feedback');
    downloadBlob(blob, 'hailin-feedback.csv');
    message.success('反馈 CSV 已导出');
  };

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card>
        <Space wrap className="toolbar">
          <Select
            value={status}
            options={feedbackStatusOptions}
            onChange={(value) => setParam('status', value)}
            className="status-filter"
          />
          <Input.Search
            allowClear
            defaultValue={q}
            placeholder="搜索昵称、联系方式或反馈内容"
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
              <Alert type="warning" showIcon message="所选反馈没有共同可流转状态" />
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
        kind="feedback"
        open={Boolean(detail)}
        record={detail}
        statusOptions={feedbackStatusOptions}
        saving={statusMutation.isPending}
        onClose={() => setDetail(null)}
        onSave={(payload) => detail && statusMutation.mutate({ id: detail.id, nextStatus: payload.status, note: payload.note })}
      />
    </Space>
  );
}
