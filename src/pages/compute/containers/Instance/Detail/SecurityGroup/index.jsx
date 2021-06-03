// Copyright 2021 99cloud
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from 'react';
import { observer, inject } from 'mobx-react';
import { toJS } from 'mobx';
import globalServerStore from 'stores/nova/instance';
import {
  Button,
  Table,
  Collapse,
  Divider,
  Col,
  Row,
  Radio,
  Spin,
  Tabs,
} from 'antd';
import PrimaryActionButtons from 'components/Tables/Base/PrimaryActionButtons';
import classnames from 'classnames';
import interfaceImg from '@/asset/image/interface.png';
import { CaretRightOutlined } from '@ant-design/icons';
import ItemActionButtons from 'components/Tables/Base/ItemActionButtons';
import { columns } from 'resources/security-group-rule';
import { isAdminPage } from 'utils/index';
import styles from './index.less';
import Detach from './action/Detach';
import ManageSecurityGroup from './action/ManageSecurityGroup';

const { Panel } = Collapse;
const { TabPane } = Tabs;
const tableColumns = columns.filter((it) => it.dataIndex !== 'direction');

@inject('rootStore')
@observer
export default class SecurityGroup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeInterfaceId: null,
      activeInterface: null,
      filterData: [],
    };
    this.store = globalServerStore;
  }

  componentDidMount = async () => {
    this.actionCallback(true);
  };

  get isAdminPage() {
    const { pathname } = this.props.location;
    return isAdminPage(pathname);
  }

  actionCallback = async (first) => {
    const {
      match: {
        params: { id },
      },
    } = this.props;
    await this.store.fetchSecurityGroup({ id });
    const { activeInterface } = this.state;
    const params = first
      ? this.store.securityGroups.interfaces[0]
      : activeInterface;
    this.filterSecurityGroup(params);
  };

  filterSecurityGroup = (item) => {
    const { data } = this.store.securityGroups;
    const filterData = toJS(data).filter(
      (it) => item.security_groups.indexOf(it.id) !== -1
    );
    this.setState({
      activeInterfaceId: item.id,
      activeInterface: item,
      filterData,
    });
  };

  renderPanelTitle(item) {
    const { activeInterfaceId, filterData } = this.state;
    const newItem = {
      ...item,
      activeInterfaceId,
      filterData,
    };
    return (
      <div>
        <Row>
          <Col span={22}>
            <span>{t('Security Group')}</span>
            <Divider type="vertical" className={styles['header-divider']} />
            <Button type="link">{item.name}</Button>
          </Col>
          <Col span={2}>
            {filterData.length !== 1 && !this.isAdminPage ? (
              <ItemActionButtons
                actions={{ firstAction: Detach }}
                onFinishAction={this.actionCallback}
                item={newItem}
              >
                {t('Detach')}
              </ItemActionButtons>
            ) : null}
          </Col>
        </Row>
      </div>
    );
  }

  renderPanel(item, index) {
    const egressData = item.security_group_rules.filter(
      (it) => it.direction === 'egress'
    );
    const IngressData = item.security_group_rules.filter(
      (it) => it.direction === 'ingress'
    );
    return (
      <Panel
        header={this.renderPanelTitle(item, index)}
        key={item.id}
        className={styles.panel}
      >
        <Tabs defaultActiveKey={`${item.id}-1`}>
          <TabPane tab={t('Egress')} key={`${item.id}-1`}>
            <Table
              size="middle"
              pagination={false}
              bordered={false}
              {...this.state}
              columns={tableColumns}
              dataSource={egressData}
            />
          </TabPane>
          <TabPane tab={t('Ingress')} key={`${item.id}-2`}>
            <Table
              size="middle"
              pagination={false}
              bordered={false}
              {...this.state}
              columns={tableColumns}
              dataSource={IngressData}
            />
          </TabPane>
        </Tabs>
      </Panel>
    );
  }

  renderRadio(item, index) {
    return (
      <Radio.Button
        onClick={() => this.filterSecurityGroup(item)}
        value={index}
      >
        <div>
          <Row>
            <Col span={10}>
              <img className={styles.image} alt="example" src={interfaceImg} />
            </Col>
            <Col span={14}>
              {/* <span style={{ fontSize: 20 }}>Interface</span> */}
              <div style={{ fontSize: 12 }}>
                {t('Interface Name:')} {item.id.substring(0, 8)}{' '}
              </div>
              <div className={styles['security-group-text']}>
                {t('Security Group Num:')} {item.security_groups.length}
              </div>
            </Col>
          </Row>
        </div>
      </Radio.Button>
    );
  }

  render() {
    const { interfaces, isLoading } = this.store.securityGroups;
    const { filterData, activeInterfaceId } = this.state;
    return (
      <div className={classnames(styles.wrapper, this.className)}>
        <Spin spinning={isLoading}>
          <Radio.Group
            defaultValue={0}
            size="large"
            marginBottom="20"
            onChange={this.onChange}
            className={styles['radio-button']}
          >
            {interfaces
              ? toJS(interfaces).map((item, index) =>
                  this.renderRadio(item, index)
                )
              : null}
          </Radio.Group>
        </Spin>
        {!this.isAdminPage && (
          <div style={{ marginBottom: 20, marginTop: 20 }}>
            <PrimaryActionButtons
              primaryActions={[ManageSecurityGroup]}
              onFinishAction={this.actionCallback}
              containerProps={{
                port: activeInterfaceId,
                filterData,
              }}
            >
              {t('Attach Security Group')}
            </PrimaryActionButtons>
            {/* <Button type="primary" shape="circle" size={5} onClick={this.refresh}>{t('Attach Security Group')}</Button> */}
          </div>
        )}
        <Spin spinning={isLoading}>
          <Collapse
            className={styles.collapse}
            accordion
            bordered={false}
            expandIcon={({ isActive }) => (
              <CaretRightOutlined rotate={isActive ? 90 : 0} />
            )}
          >
            {filterData
              ? filterData.map((item, index) => this.renderPanel(item, index))
              : null}
          </Collapse>
        </Spin>
      </div>
    );
  }
}