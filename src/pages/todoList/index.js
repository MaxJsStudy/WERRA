import React, { PureComponent } from 'react';
import { Table, Card, Icon, Modal, Form, Input, Button, Upload } from 'antd';
import { Ellipsis } from 'ant-design-pro';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import moment from 'moment';
import { getTodoList, create, update, deleteOne, finish } from './action';
import './index.less';

const FormItem = Form.Item;
const { TextArea } = Input;

// 高阶组件
// @connect(a, b)
// 前者负责从全局应用状态state中取出所需数据，映射到展示组件的props，后者负责把需要用到的action映射到展示组件的props上。
// 每当store中的state更新时，a就会重新执行，重新计算传递给展示组件的props，从而触发组件的重新渲染
// 可以省略a参数，这样state的更新就不会引起组件的重新渲染
// b接收store.dispatch方法作为参数，返回展示组件用来修改state的函数
@connect(
    state => state,
    {
        getTodoList,
        create,
        update,
        deleteOne,
        finish
    }
)

class TodoList extends PureComponent {
    static propTypes = {
        getTodoList: PropTypes.func.isRequired,
        create: PropTypes.func.isRequired,
        update: PropTypes.func.isRequired,
        deleteOne: PropTypes.func.isRequired,
        finish: PropTypes.func.isRequired,
        todoListReducer: PropTypes.shape({
            listData: PropTypes.array.isRequired
        }).isRequired
    };
    constructor(props){
        super(props);
        this.state = {
            data: [],
            id: 0
        }
    }
    componentDidMount(){
        this.init();
    }
    init = () => {
        this.props.getTodoList({}, ()=>{
            this.setState({
                data: this.props.todoListReducer.listData
            })
        }); 
    }
    renderTable = () => {
        const columns = [{
            title:'概述',
            dataIndex: 'summary',
            align: 'center'
        }, {
            title:'详情',
            dataIndex: 'details',
            align: 'center',
            render: (text) => (
                <Ellipsis length={ 50 } tooltip>{text}</Ellipsis>
            )
        }, {
            title:'创建时间',
            dataIndex: 'createTime',
            align: 'center',
            render: (text) => (
                <span>{moment(text).format('YYYY/MM/DD HH:mm')}</span>
            )
        }, {
            title:'操作',
            dataIndex: 'options',
            align: 'center',
            render: (text, record) => (
                <div>
                    {!record.is_finished &&
                        <a style={{ cursor:'pointer' }} onClick={this.edit.bind(this, record)}>编辑</a>
                    }
                    {record.is_finished ? 
                        <span style={{ margin:'0 8px' }}>已完成</span>
                        : <a style={{ margin:'0 8px', cursor:'pointer' }} onClick={this.finish.bind(this, record.id)}>标记完成</a>
                    }
                    <a style={{ cursor:'pointer' }} onClick={this.delete.bind(this, record.id)}>删除</a>
                </div>
            )
        }];
        const { data } = this.state;
        return (
            <Table
                columns={columns}
                dataSource={data}
                rowKey={record => record.id}
            />
        )
    }
    renderModal = () => {
        const { getFieldDecorator } = this.props.form;
        const formItemLayout = {
            labelCol: { span: 4 },
            wrapperCol: { span: 18 },
        };
        return (
            <Modal
                visible={this.state.visible}
                onCancel={this.cancel}
                onOk={this.ok}
            >
                <Form style={{ marginTop:20 }}>
                    <FormItem label="概述" {...formItemLayout}>
                        {
                            getFieldDecorator('summary',{
                                rules: [{
                                    required: true,
                                    message: '概述必填',
                                    whitespace: true
                                }]
                            })(
                                <Input
                                    maxLength={40}
                                />
                            )
                        }
                    </FormItem>
                    <FormItem label="详情" {...formItemLayout}>
                        {
                            getFieldDecorator('details')(
                                <TextArea 
                                    autosize={{minRows:2, maxRows:5}}
                                    maxLength={200}
                                />
                            )
                        }
                    </FormItem>
                </Form>
            </Modal>
        )
    }
    // 打开编辑/新增 框
    edit = (record) => {
        if(record){
            this.setState({ id: Number(record.id) });
            this.props.form.setFieldsValue({
                summary: record.summary || undefined,
                details: record.details || undefined,
            });
        }
        this.setState({ visible: true });
    }
    // 编辑
    ok = () => {
        this.props.form.validateFields((err, values)=>{
            if(1) {
                let params = {
                    summary: values.summary,
                    details: values.details,
                    id: this.state.id
                }
                if (params.id) {
                    this.props.update(params,(data)=>{
                        console.log(data)
                        this.init();
                    });
                } else {
                    delete params.id
                    params.is_finished = 0;
                    params.is_del = 0;
                    this.props.create(params,(data)=>{
                        console.log(data)
                        this.init();
                    });
                }
                this.cancel();
            }
        })
    }
    // 取消
    cancel = () => {
        this.setState({ visible: false });
        this.props.form.resetFields();
    }
    // 删除
    delete = (id) => {
        this.props.deleteOne({id:Number(id)},()=>{
            this.init();
        });
    }
    // 标记完成
    finish = (id) => {
        this.props.finish({id:Number(id)},()=>{
            this.init();
        });
    }
    render() {
        const props = {
            name: 'file',
            action: '/node/todo/upload',
            headers: {
              authorization: 'authorization-text',
            },
            onChange(info) {
              if (info.file.status !== 'uploading') {
                console.log(info.file, info.fileList);
              }
              if (info.file.status === 'done') {
                message.success(`${info.file.name} file uploaded successfully`);
              } else if (info.file.status === 'error') {
                message.error(`${info.file.name} file upload failed.`);
              }
            },
        };
        return (
            <Card>
                <Button
                    type="primary"
                    onClick={this.edit}
                    style={{ marginBottom:20 }}
                >新建</Button>
                {this.renderTable()}
                {this.renderModal()}
                <Upload {...props}>
                    <Button>上传文件</Button>
                </Upload>
            </Card>
        )
    }
}

export default Form.create()(TodoList);