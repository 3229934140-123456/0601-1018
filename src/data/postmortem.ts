import type { PostmortemReport } from '../types';

export const postmortemReports: PostmortemReport[] = [
  {
    id: 'pm-001',
    incidentId: 'inc-001',
    title: '支付服务连接池泄漏事故复盘',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-18T14:30:00Z'),
    status: 'published',
    content: {
      summary: '2024年1月15日09:30-10:45，订单服务因数据库连接池耗尽导致无法处理新订单，影响时长约75分钟。期间用户下单成功率降至35%，预计影响订单量约1.2万单。',
      timeline: '09:30 - 数据库CPU使用率突增至95%\n09:35 - 订单服务响应时间超过5s阈值\n09:40 - 告警触发，值班人员收到通知\n09:50 - 值班人员确认数据库连接池已满\n10:00 - 尝试重启订单服务，问题暂时缓解\n10:15 - 连接池再次耗尽，问题复现\n10:25 - 定位到慢查询导致连接占用时间过长\n10:35 - 优化慢查询SQL并发布紧急补丁\n10:45 - 服务恢复正常',
      rootCause: '订单查询接口使用了未优化的SQL语句，在大促流量下执行时间从50ms增至3s以上，导致数据库连接被长时间占用，连接池迅速耗尽，新请求无法获取连接而失败。',
      impact: '持续75分钟的服务降级，影响约1.2万订单，预估营收损失约80万元。用户投诉量较平日增加3倍，品牌形象受损。',
      actionItems: [
        {
          id: 'ai-001',
          description: '优化订单查询SQL，添加合适的索引',
          owner: '张伟',
          dueDate: new Date('2024-01-20T00:00:00Z'),
          status: 'completed'
        },
        {
          id: 'ai-002',
          description: '增加数据库连接池监控和告警',
          owner: '李娜',
          dueDate: new Date('2024-01-22T00:00:00Z'),
          status: 'completed'
        },
        {
          id: 'ai-003',
          description: '建立慢查询自动检测机制',
          owner: '王强',
          dueDate: new Date('2024-02-01T00:00:00Z'),
          status: 'in-progress'
        }
      ],
      lessonsLearned: '1. 数据库性能问题具有累积效应，小问题在流量高峰时会被放大\n2. 连接池耗尽是严重问题，需要更灵敏的监控和更快的响应\n3. 慢查询治理是持续性工作，需要定期巡检\n4. 应急响应流程需要优化，缩短定位时间'
    }
  },
  {
    id: 'pm-002',
    incidentId: 'inc-002',
    title: '搜索服务性能问题事故复盘',
    createdAt: new Date('2024-02-08T15:00:00Z'),
    updatedAt: new Date('2024-02-10T09:00:00Z'),
    status: 'published',
    content: {
      summary: '2024年2月8日14:15-16:30，支付网关因第三方支付通道超时，导致约30%的支付请求失败。影响时长135分钟，涉及支付金额约250万元。',
      timeline: '14:15 - 支付成功率开始下降\n14:20 - 支付网关触发告警\n14:25 - 确认第三方通道A响应超时\n14:30 - 手动切换至备用通道B\n14:45 - 通道B也出现超时现象\n15:00 - 联系第三方支付服务商\n15:30 - 第三方确认其机房网络故障\n16:00 - 第三方逐步恢复服务\n16:30 - 所有支付通道恢复正常',
      rootCause: '第三方支付服务商主备机房同时出现网络故障，导致我们的主备通道均不可用。我们的支付网关没有实现降级策略，超时时间设置过长，加剧了影响。',
      impact: '约30%的支付请求失败，影响用户支付体验，部分用户重复支付造成资损风险。客服工单量激增，需要人工处理退款和对账。',
      actionItems: [
        {
          id: 'ai-004',
          description: '增加第三家支付通道作为备份',
          owner: '刘洋',
          dueDate: new Date('2024-03-01T00:00:00Z'),
          status: 'in-progress'
        },
        {
          id: 'ai-005',
          description: '实现支付网关自动降级和快速超时',
          owner: '陈明',
          dueDate: new Date('2024-02-25T00:00:00Z'),
          status: 'completed'
        },
        {
          id: 'ai-006',
          description: '完善重复支付的自动退款机制',
          owner: '赵芳',
          dueDate: new Date('2024-02-28T00:00:00Z'),
          status: 'pending'
        }
      ],
      lessonsLearned: '1. 不能完全依赖第三方的高可用性，需要自身具备容错能力\n2. 多通道备份需要考虑独立性，避免单点故障\n3. 超时时间设置对系统韧性至关重要\n4. 与第三方服务商需要建立更紧密的故障沟通机制'
    }
  },
  {
    id: 'pm-003',
    incidentId: 'inc-003',
    title: '数据库索引损坏事故复盘',
    createdAt: new Date('2024-03-20T11:00:00Z'),
    updatedAt: new Date('2024-03-22T16:00:00Z'),
    status: 'published',
    content: {
      summary: '2024年3月20日10:20-11:45，用户服务因Redis缓存集群故障导致缓存雪崩，数据库压力剧增，用户登录和信息查询接口响应缓慢。',
      timeline: '10:20 - Redis集群主节点故障\n10:22 - 从节点提升为主节点\n10:25 - 大量缓存未命中，数据库QPS飙升\n10:30 - 数据库CPU达到100%\n10:35 - 用户服务响应超时告警\n10:45 - 启动服务限流措施\n11:00 - Redis集群恢复，开始缓存预热\n11:30 - 缓存命中率逐步回升\n11:45 - 服务完全恢复正常',
      rootCause: 'Redis主节点发生硬件故障，虽然自动故障转移成功，但期间大量缓存数据丢失，导致请求直接打到数据库，数据库无法承受瞬时流量而性能下降。',
      impact: '用户登录成功率降至60%，页面加载缓慢，影响用户体验约85分钟。部分活动页面无法正常展示，影响活动转化率。',
      actionItems: [
        {
          id: 'ai-007',
          description: '实现多级缓存策略（本地缓存+分布式缓存）',
          owner: '林凯',
          dueDate: new Date('2024-04-15T00:00:00Z'),
          status: 'in-progress'
        },
        {
          id: 'ai-008',
          description: '增加缓存预热和降级机制',
          owner: '周婷',
          dueDate: new Date('2024-04-01T00:00:00Z'),
          status: 'completed'
        },
        {
          id: 'ai-009',
          description: '优化数据库连接池和读写分离',
          owner: '吴俊',
          dueDate: new Date('2024-04-10T00:00:00Z'),
          status: 'pending'
        }
      ],
      lessonsLearned: '1. 缓存故障转移不等于数据不丢失，需要考虑缓存重建策略\n2. 数据库需要有足够的弹性应对缓存失效场景\n3. 限流降级是保护系统的重要手段\n4. 需要定期进行故障演练，验证系统韧性'
    }
  },
  {
    id: 'pm-004',
    incidentId: 'inc-004',
    title: '消息队列积压事故复盘',
    createdAt: new Date('2024-04-12T09:00:00Z'),
    updatedAt: new Date('2024-04-13T11:00:00Z'),
    status: 'draft',
    content: {
      summary: '2024年4月11日晚高峰期间，订单消息队列出现严重积压，导致物流出库延迟约2小时，影响约5000个订单的发货时效。',
      timeline: '18:30 - 消息队列积压量开始上升\n19:00 - 积压超过10万条，触发告警\n19:15 - 物流消费组消费速率下降\n19:30 - 排查发现物流系统接口响应变慢\n20:00 - 临时增加消费节点，效果不明显\n20:30 - 定位到物流系统数据库锁等待严重\n21:00 - 重启物流服务，消费速率恢复\n22:00 - 消息积压全部处理完毕\n22:30 - 所有订单恢复正常出库',
      rootCause: '物流系统数据库更新语句缺少索引，导致行锁升级为表锁，并发写入时锁等待严重，消息消费速率急剧下降，造成消息队列积压。',
      impact: '约5000个订单发货延迟2小时，部分用户收到延迟通知，客服咨询量增加。部分次日达订单可能无法按时送达，需要赔付。',
      actionItems: [
        {
          id: 'ai-010',
          description: '优化物流系统数据库表索引',
          owner: '孙磊',
          dueDate: new Date('2024-04-18T00:00:00Z'),
          status: 'completed'
        },
        {
          id: 'ai-011',
          description: '增加消息队列积压深度监控和自动告警',
          owner: '黄海',
          dueDate: new Date('2024-04-20T00:00:00Z'),
          status: 'in-progress'
        },
        {
          id: 'ai-012',
          description: '实现消费速率自适应调整机制',
          owner: '徐丽',
          dueDate: new Date('2024-05-01T00:00:00Z'),
          status: 'pending'
        }
      ],
      lessonsLearned: '1. 消息队列积压是下游系统故障的重要信号\n2. 数据库锁问题会严重影响消息消费性能\n3. 需要建立消息积压的快速响应机制\n4. 消费能力需要具备弹性扩展能力'
    }
  },
  {
    id: 'pm-005',
    incidentId: 'inc-005',
    title: '认证服务流量突增事故复盘',
    createdAt: new Date('2024-05-05T14:00:00Z'),
    updatedAt: new Date('2024-05-05T14:00:00Z'),
    status: 'draft',
    content: {
      summary: '2024年5月5日下午，华南地区CDN节点出现故障，导致该地区用户访问网站时图片、CSS等静态资源加载缓慢，页面展示异常。',
      timeline: '13:40 - 华南地区用户反馈页面加载缓慢\n13:50 - 监控确认华南CDN节点响应时间升高\n14:00 - 联系CDN服务商确认节点故障\n14:15 - CDN服务商开始切换流量到备用节点\n14:30 - 华南地区流量逐步切换完成\n14:45 - 页面加载速度恢复正常\n15:00 - 故障节点开始维修',
      rootCause: 'CDN服务商华南地区某机房电力故障，导致该区域多个CDN节点同时下线，虽然有备用节点，但切换过程需要时间，期间用户访问受到影响。',
      impact: '华南地区约200万用户受到影响，页面加载时间从1秒增加到8秒以上，部分用户无法正常浏览商品。预计影响转化率下降约15%。',
      actionItems: [
        {
          id: 'ai-013',
          description: '评估引入第二家CDN服务商',
          owner: '马强',
          dueDate: new Date('2024-05-20T00:00:00Z'),
          status: 'pending'
        },
        {
          id: 'ai-014',
          description: '实现静态资源多CDN自动切换',
          owner: '胡杰',
          dueDate: new Date('2024-06-01T00:00:00Z'),
          status: 'pending'
        },
        {
          id: 'ai-015',
          description: '增加前端资源加载失败的降级处理',
          owner: '罗敏',
          dueDate: new Date('2024-05-15T00:00:00Z'),
          status: 'in-progress'
        }
      ],
      lessonsLearned: '1. CDN单点服务商存在区域性故障风险\n2. 前端需要有资源加载失败的降级策略\n3. 需要建立更主动的CDN质量监控\n4. 与CDN服务商的SLA需要更明确的故障响应时间'
    }
  }
];
