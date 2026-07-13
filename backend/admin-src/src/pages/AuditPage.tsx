import { App, Button, Card, Input, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { fetchBackupBlob, listAudit } from '../api';
import type { AuditRecord } from '../types';
import { auditActionText, compactJson, downloadBlob, formatDate } from '../utils';

const pageSize = 12;

export function AuditPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { message } = App.useApp();
  const page = Number(searchParams.get('page') || 1);
  const q = searchParams.get('q') || '';

  const query = useQuery({
    queryKey: ['audit', { page, q }],
    queryFn: () => listAudit({ page, pageSize, q })
  });

  const setParam = (key: string, value: string | number) => {
    const next = new URLSearchParams(searchParams);
    if (value === '') next.delete(key);
    else next.set(key, String(value));
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const exportBackup = async () => {
    const blob = await fetchBackupBlob();
    downloadBlob(blob, `hailin-backup-${new Date().toISOString().slice(0, 10)}.json`);
    message.success('完整备份已下载');
  };

  const columns: ColumnsType<AuditRecord> = [
    {
      title: '操作',
      dataIndex: 'action',
      width: 180,
      render: (value) => <Tag color="blue">{auditActionText(value)}</Tag>
    },
    { title: '对象', render: (_, record) => `${record.targetType || '-'} / ${record.targetId || '-'}`, width: 220 },
    { title: '管理员', dataIndex: 'adminUser', width: 140 },
    { title: '时间', dataIndex: 'createdAt', render: formatDate, width: 170 },
    { title: '详情', dataIndex: 'detail', render: compactJson }
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Card>
        <Space wrap className="toolbar">
          <Input.Search
            allowClear
            defaultValue={q}
            placeholder="搜索操作、对象、管理员或详情"
            onSearch={(value) => setParam('q', value.trim())}
            className="search-box"
          />
          <Button onClick={exportBackup}>下载完整备份 JSON</Button>
        </Space>
      </Card>
      <Card>
        <Table
          rowKey="id"
          loading={query.isLoading}
          dataSource={query.data?.items || []}
          columns={columns}
          pagination={{
            current: page,
            pageSize,
            total: query.data?.total || 0,
            showSizeChanger: false,
            onChange: (nextPage) => setParam('page', nextPage)
          }}
        />
      </Card>
    </Space>
  );
}
