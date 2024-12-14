<template>
    <div style="background-color: var(--td-bg-color-container);border-radius: 5px;">
        <div style="display: flex;flex-direction: row;padding: 12px;justify-content: space-between;">
            <t-space size="small">
                <t-button variant="outline" theme="primary" @click="handleAdd">
                    <template #icon>
                        <t-icon name="add" />
                    </template>
                    添加账号
                </t-button>
                <t-popconfirm theme="danger" content="确认删除？删除后不可恢复！" placement="bottom" :onConfirm="DeleteEquipment">
                    <t-button :disabled="SelectData.length === 0" theme="danger">
                        <template #icon>
                            <t-icon name="delete" />
                        </template>
                        {{ SelectData.length == 0 ? "删除" : "删除 " + SelectData.length + " 个" }}
                    </t-button>
                </t-popconfirm>
                <t-button  theme="success" @click="exportToXlsx">
                    <template #icon>
                        <t-icon name="file-export" />
                    </template>
                    导出账号列表
                </t-button>
                <!-- <t-upload theme="file" accept=".xls,.xlsx" :requestMethod="uploadFile" /> -->
            </t-space>
        </div>
        <div>
            <t-table row-key="id" :columns="table_Columns" :data="table_Data" select-on-row-click
                :reserveSelectedRowOnPaginate="false" :sort="table_Sort" @sort-change="sortChange"
                @select-change="handleTableSelectChange" @page-change="onPageChange" :pagination="table_Pagination"
                :loading="table_Loading" cellEmptyContent="-" stripe bordered>
            </t-table>
        </div>
    </div>
    <!--Edit Dialog include add-->
    <t-dialog v-model:visible="Dialog_Model.edit" :header="(actionMode === 'add' ? '新增' : '编辑') + '用户'" width="45%" :closeBtn="false" cancelBtn="取消"
        confirmBtn="提 交" :onConfirm="submitForm" :closeOnEscKeydown="false">
        <mtb-tag TAG />
        <div style="width: 100%; margin-top: 8px">
            <t-space direction="horizontal" size="16px" style="width: 100%">
                <t-space direction="vertical" size="12px" style="width: 100%">
                    <div style="font-size: 20px;font-weight: 700;color: var(--td-text-color-primary);">基本信息</div>
                    <div>
                        <t-input v-model="EditUserDialogFrom.name" label="用户名称：" type="text" required />
                    </div>
                    <div>
                        <t-input v-model="EditUserDialogFrom.code" label="用户Code：" type="text" required />
                    </div>
                    <div>
                        <t-input v-model="EditUserDialogFrom.class" label="班级：" type="text" unrequired />
                    </div>
                    <div>
                        <t-input-number v-model="EditUserDialogFrom.grade" theme="column" :max="2099" :min="2021"
                            label="年级：" unrequired style="width: 100%;"></t-input-number>
                    </div>
                    <div>
                        <div style="display: flex">
                            <t-input v-if="actionMode === 'add'" required v-model="EditUserDialogFrom.password" label="账户密码：" type="text" />
                            <t-input v-else unrequired v-model="EditUserDialogFrom.password" label="账户密码：" type="text" />
                            <t-button variant="dashed" @click="EditUserDialogFrom.password = '123456'">默认密码</t-button>
                        </div>
                    </div>
                </t-space>
                <t-space direction="vertical" size="12px" style="width: 100%">
                    <div style="font-size: 20px;font-weight: 700;color: var(--td-text-color-primary);">其他信息</div>
                    <div required>
                        <t-button variant="dashed" block @click="showPermissionsDialog">配置权限</t-button>
                    </div>
                    <div>
                        <t-select :value="EditUserDialogFrom.group" :options="groupOptions" label="组别：" placeholder="请选择"
                            :onChange="(e) => { EditUserDialogFrom.group = e }" />
                    </div>
                    <div>
                        <t-input-number v-model="EditUserDialogFrom.share_device" theme="column" :max="99" :min="0"
                            label="共享设备数：" style="width: 100%;"></t-input-number>
                    </div>
                    <div style="display: flex;align-items: center;">
                        <span
                            style="width: 25%;z-index: 2;height: 100%;text-align: center;display: flex;align-items: center;font-size: var(--td-font-size-body-medium);color: var(--td-text-color-primary);">加入时间：</span>
                        <t-date-picker style="width: 100%;" :allowInput="true" placeholder="请选择"
                            :value="EditUserDialogFrom.join_time"></t-date-picker>
                    </div>
                    <div style="display: flex;align-items: center;">
                        <span
                            style="width: 25%;z-index: 2;height: 100%;text-align: center;display: flex;align-items: center;font-size: var(--td-font-size-body-medium);color: var(--td-text-color-primary);">注册时间：</span>
                        <t-date-picker style="width: 100%;" :allowInput="true" placeholder="请选择"
                            format="YYYY-MM-DD HH:mm:ss" :enableTimePicker="true"
                            :value="EditUserDialogFrom.reg_time"></t-date-picker>
                    </div>
                </t-space>
            </t-space>
        </div>
    </t-dialog>
    <!--Permissions Dialog-->
    <t-dialog v-model:visible="Dialog_Model.permissions" header="配置权限" width="40%" :closeBtn="false" cancelBtn="取消"
        confirmBtn="保存" :closeOnEscKeydown="false" :destroyOnClose="true" :onClose="handlePermissionDialogClose" :onConfirm="handleSavePermissions">
        <t-transfer :data="permissionsTransfer.data" v-model="permissionsTransfer.value" :operation="['移除', '添加']" class="transfer-horizontal" :onChange="handlePermissionsTransferChange">
            <template #title="props">
              <div>{{ props.type === 'target' ? '目标' : '来源' }}</div>
            </template>
            <template #footer="props">
              <div class="transfer-footer--tagGroup narrow-scrollbar" v-if="activeGroupPermissions.length !== 0 && props.type === 'target'">
                <span v-for="(item, index) in activeGroupPermissions">
                    <span class="group-permission--item">{{ permissionsTransfer.nameList[item?.val] }}</span>
                </span>
              </div>
            </template>
            <template #transferItem="{ data, index, type }">
                <div :data-transfer-checkbox-id="index" style="margin-left: 8px;">
                    <t-tag
                    v-if="activeGroupPermissions.map(item => item.val).includes(data.value) && type === 'target'"
                    color="rgb(217, 0, 87)"
                    variant="light-outline"
                    size="small"
                    style="margin-right: 4px;">
                        <span>重复</span>
                    </t-tag>
                    {{ data.label }}
                    <span
                        v-if="type === 'target'"
                        class="UserCanTSelect"
                        @click.prevent="() => { togglePermissionStatus(data.value) }">
                        <t-tag
                        :theme="permissionsTransfer.statusList[data.value]?.open === true ? 'success' : permissionsTransfer.statusList[data.value]?.open === false ? 'danger' : 'warning'"
                        variant="light-outline"
                        size="small"
                        style="margin-left: 4px">
                            <span v-if="permissionsTransfer.statusList[data.value]?.open === true">开启</span>
                            <span v-else-if="permissionsTransfer.statusList[data.value]?.open === false">关闭</span>
                            <span v-else>⚠ 未知状态</span>
                        </t-tag>
                    </span>
                </div>
            </template>
        </t-transfer>
        <!-- <PermissionsTransfer :value="permissionsValue" :data="systemPermissionsList" :user="activeUserPermissions" :group="activeGroupPermissions"></PermissionsTransfer> -->
    </t-dialog>
</template>

<script setup lang="tsx">
import { computed, onMounted, reactive, ref } from "vue";
import dayjs from 'dayjs';
import { NotifyPlugin } from "tdesign-vue-next";
import { config } from "../../components/config";
import sha256 from 'crypto-js/sha256'
import useRequest from "../../hooks/useRequest";
import { loadSystemPermissions, loadUserPermissionsList } from "../../hooks/usePermission.ts";
import { PermissionsArray, PermissionsObject, userListObject } from "../../types/type.ts";
import { TransferProps } from 'tdesign-vue-next';
import ExcelJS from 'exceljs';

const table_Columns = [
    {
        colKey: "row-select",
        type: "multiple",
        width: 45,
    },
    {
        colKey: "id",
        title: "id",
        sortType: "all",
        sorter: true,
        width: 80,
    },
    {
        colKey: "code",
        title: "Code",
        sortType: "all",
        sorter: true,
        width: 200,
    },
    {
        colKey: "name",
        title: "姓名",
    },
    { colKey: "class", title: "班级", sortType: "all", sorter: true },
    {
        colKey: "grade", title: "年级", sortType: "all", sorter: true, width: 120,
        cell: (h, { row }) => {
            return <t-tag>{row.grade + "级"}</t-tag>
        }
    },
    {
        colKey: "group", title: "组别", sortType: "all", sorter: true, width: 110,
        cell: (h, { row }) => {
            return (
                <span>{ groupOptions.value.find(item => item.value === row.group )?.label ?? "-" }</span>
            )
        }
    },
    {
        colKey: "reg_time", title: "注册日期", sortType: "all", sorter: true, ellipsis: true,
        cell: (h, { row }) => {
            return dayjs(row.reg_time).format('YYYY-MM-DD HH:mm:ss')
        }
    },
    {
        colKey: "join_time", title: "加入时间", sortType: "all", sorter: true, ellipsis: true,
        cell: (h, { row }) => {
            return dayjs(row.join_time).format('YYYY-MM-DD')
        }
    },
    {
        colKey: "login_time", title: "上次登录时间", sortType: "all", sorter: true, ellipsis: true,
        cell: (h, { row }) => {
            return row.login_time ? dayjs(row.login_time).format('YYYY-MM-DD HH:mm:ss') : '-'
        }
    },
    {
        colKey: "operation",
        title: "操作",
        cell: (h, { row }) => {
            return (
                <t-space>
                    <t-link theme="primary" onClick={ (e) => handleEdit(e,row) }>编辑</t-link>
                    <t-link theme="danger">删除</t-link>
                </t-space>
            )
        },
    }
    // {
    //     colKey: "status",
    //     title: "账号状态",
    //     sortType: "all",
    //     sorter: true,
    // },
]
const table_Data = ref([])
const table_BackData = ref([])
const table_Sort = ref({
    sortBy: "id",
    descending: false,
})
const table_Loading = ref(false)
const SelectData = ref([])
const Dialog_Model = reactive({
    permissions: false,
    edit: false,
})
const actionMode = ref("add")
const defaultDialogData = {
    id: null,
    name: null,
    class: null,
    code: null,
    password: null,
    share_device: 2,
    group: null,
    grade: dayjs().year(),
    reg_time: new Date(),
    join_time: new Date(),
}
const EditUserDialogFrom = ref<userListObject>({...defaultDialogData})
const upload_file_data = ref([])
const groupOptions = ref([])// 组列表
const permissionsValue = ref([])
const systemPermissionsList = ref([])// 权限列表
// 权限管理 备份数据 用于 未保存后的还原操作
const backupPermissionsValue = reactive({
    value: [],// target
    data: []// source
})
// 权限穿梭框数据
const permissionsTransfer = reactive({
    data: [],
    value: [],
    nameList: {},
    statusList: {},
    // 代理，最终提交的数据，按状态分类提交。
    proxyStatus: {},
})

const userPermissionsList = ref<{users?: object, group?: object}>({})
const activeUserPermissions = ref([])
const activeGroupPermissions = ref([])
const table_Pagination = computed(() => {
    return {
        current: 1,
        pageSize: 25,
        pageSizeOptions: [25, 75, 115, 150],
        total: table_Data.value.length,
        showJumper: true,
    };
})

const loadSystemPermissionsList = () => {
    loadSystemPermissions().then((res: PermissionsArray) => {
        systemPermissionsList.value = JSON.parse(JSON.stringify(res))
        backupPermissionsValue.data = JSON.parse(JSON.stringify(res))
        permissionsTransfer.data = res.map(item => {
            return {
                label: item.object,
                value: item.val
            }
        })
        permissionsTransfer.nameList = res.reduce((acc, cur) => {
            acc[cur.val] = cur.object
            return acc
        }, {})
    }).catch((err) => {
        console.error(err)
    })
}

const loadUserPermissions = () => {
    loadUserPermissionsList().then((res) => {
        userPermissionsList.value = res
    }).catch((err) => {
        console.error(err)
    })
}

const handleAdd = () => {
    actionMode.value = "add"
    initPermissionsTransfer()
    EditUserDialogFrom.value = {...defaultDialogData}
    Dialog_Model.edit = true
}

const handleEdit = (e:Event, row) => {
    e.stopPropagation()
    actionMode.value = "edit"
    const { id, group } = row
    activeUserPermissions.value = userPermissionsList.value?.users[id] ?? []
    activeGroupPermissions.value = userPermissionsList.value?.group[group] ?? []
    EditUserDialogFrom.value = {...row}
    initPermissionsTransfer()
    Dialog_Model.edit = true
}

// 初始权限穿梭框
const initPermissionsTransfer = () => {
    permissionsTransfer.value = []
    permissionsTransfer.statusList = {}
    permissionsTransfer.proxyStatus = {}
    // 
    handlePermissionDialogClose()
    if (actionMode.value === "edit") {
        permissionsTransfer.value = activeUserPermissions.value.map(item => {
            return item.val ?? "未知权限"
        })
    }
}

const showPermissionsDialog = () => {
    Dialog_Model.permissions = true
    actionMode.value === "add" ? (activeGroupPermissions.value = userPermissionsList.value?.group[EditUserDialogFrom.value["group"]] ?? []) : null
    initPermissionsTransfer()
}

// 还原权限状态
const restorePermissionsStatus = () => {
    activeUserPermissions.value.forEach(item => {
        permissionsTransfer.statusList[item.val] = {
            open: item?.open === 1 ? true : false
        }
    })
    permissionsTransfer.proxyStatus = JSON.parse(JSON.stringify(permissionsTransfer.statusList))
}

// 设置权限状态，用于记录保存后的权限状态，必需，否则会导致二次打开时权限状态丢失
const setPermissionsStatus = (val:string, open:boolean) => {
    activeUserPermissions.value.forEach(item => {
        if (item.val === val) {
            item.open = open ? 1 : 0
        }
    })
}

const handlePermissionDialogClose = () => {
    // T-Transfer组件不会改变data数据，所以下方的代码是不必要的，但仍然保留。
    // 因为没有开启 点击蒙层关闭、关闭按钮关闭、esc关闭，所以只要关闭了都要还原permissionTransfer组件的数据
    // permissionsTransfer.data = systemPermissionsList.value.map(item => {
    //         return {
    //             label: item.object,
    //             value: item.val
    //         }
    //     })
    // 包括还原状态，不还原会影响提交数据
    restorePermissionsStatus()
}

// 穿梭框数据变化时
const handlePermissionsTransferChange:TransferProps['onChange'] = (val, ctx) => {
    const { movedValue, type } = ctx
    if (type === "target") {
        // 需要设置权限状态，默认为true
        movedValue.forEach(item => {
            permissionsTransfer.statusList[item] = {
                open: true
            }
        })
    }
    else if (type === "source") {
        // 权限状态删除
        movedValue.forEach(item => {
            delete permissionsTransfer.statusList[item]
        })
    }
}

// 保存权限
const handleSavePermissions = () => {
    permissionsTransfer.proxyStatus = JSON.parse(JSON.stringify(permissionsTransfer.statusList))
    Object.keys(permissionsTransfer.statusList).forEach(item => {
        setPermissionsStatus(item, permissionsTransfer.statusList[item]?.open)
    })
    Dialog_Model.permissions = false
}

// 切换权限开关
const togglePermissionStatus = (val) => {
    const isOpen = permissionsTransfer.statusList[val]?.open === true ? true : false
    permissionsTransfer.statusList[val] = {
        open: !isOpen
    }
}

/**
 * @InitGroupData
 * @初始化用户组数据
 */
const loadGroupData = () => {
    try {
        useRequest({
            url: "/group/list",
            methods: "POST",
            success: function (res) {
                var RES = JSON.parse(res);
                if (RES.errcode == 0){
                    for (const key in RES.data) {
                        const element = RES.data[key];
                        groupOptions.value.push({ label: element.name, value: element.id, type: element.type })
                    }
                }
            },
            error: function (err) {
                console.error(err);
                NotifyPlugin("error", {
                    title: "获取组列表失败",
                    content: err,
                    duration: 5000,
                });
            },
        });
    } catch (e) {
        console.log(e);
    }
}

/**
 * @InitTableData
 * @初始化表格数据
 */
const loadTableData = () => {
    table_Loading.value = true;
    try {
        useRequest({
            url: "/user/list",
            methods: "POST",
            success: function (res) {
                var RES = JSON.parse(res);
                table_Data.value = RES.data;
                table_BackData.value = RES.data;
            },
            error: function (err) {
                console.error(err);
                NotifyPlugin("error", {
                    title: "获取账号列表失败",
                    content: err,
                    duration: 5000,
                });
            },
            complete: function () {
                table_Loading.value = false;
            },
        });
    } catch (e) {
        console.log(e);
    }
}

/**
 * @VerifyAddForm
 * @提交添加账号验证表单
 */
// const VerifyAddForm = () => {
//     var FORMDATA = this.$data.AddUserDialogFrom;
//     if (!FORMDATA.name || !FORMDATA.code || !FORMDATA.password || FORMDATA.permissions_sum == 0) {
//         NotifyPlugin("error", {
//             title: "添加用户失败",
//             content: "请填写必填信息",
//             duration: 5000,
//         });
//         return false;
//     }
//     // PASS
//     var that = this;
//     var TOKEN = localStorage.getItem("token");
//     HTTPRequest({
//         url: config.API_URL.MAIN_URL + "/user/add",
//         methods: "POST",
//         data: {
//             name: FORMDATA.name,
//             code: FORMDATA.code,
//             class: FORMDATA.class,
//             password: sha256(FORMDATA.password),
//             permissions: FORMDATA.permissions_sum,
//             group: FORMDATA.group,
//             grade: FORMDATA.grade,
//             reg_time: new Date(FORMDATA.reg_time).getTime().toString(),
//             join_time: new Date(FORMDATA.join_time).getTime().toString(),
//         },
//         header: {
//             "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
//             token: TOKEN,
//         },
//         success: function (res) {
//             var RES = JSON.parse(res);
//             if (RES.errcode === 0) {
//                 var U_id = RES.data.id;
//                 NotifyPlugin("success", {
//                     title: "添加账号成功",
//                     content: `成功添加了id为${U_id}的用户`,
//                     duration: 5000,
//                 });
//                 console.log(`添加了id为${U_id}的用户`);
//                 // 刷新数据
//                 that.InitTableData();
//             }
//         },
//         error: function (err) {
//             NotifyPlugin("error", {
//                 title: "添加账号失败",
//                 content: err,
//                 duration: 5000,
//             });
//             console.error(err);
//         },
//     });
//     // 关闭dialog
//     this.$data.Dialog_Model.AddUser = false;
//     // 还原表单
//     FORMDATA = {
//         name: "",
//         code: "",
//         class: "",
//         password: "",
//         permissions: [16777216, 8388608, 1048576, 524288],
//         permissions_sum: 0,
//         group: 0,
//         grade: 2023,
//         reg_time: new Date(),
//         join_time: new Date(),
//     };
// }


/**
 * @DeleteEquipment
 * @删除设备
 */
// const DeleteEquipment = () => {
//     var that = this;
//     var list = this.$data.SelectData;
//     var TOKEN = localStorage.getItem("token");
//     for (const index in list) {
//         if (Object.hasOwnProperty.call(list, index)) {
//             const element = list[index];
//             HTTPRequest({
//                 url: config.API_URL.MAIN_URL + "/user/del",
//                 methods: "POST",
//                 data: {
//                     id: element.id,
//                 },
//                 header: {
//                     "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
//                     token: TOKEN,
//                 },
//                 success: function (res) {
//                     var RES = JSON.parse(res);
//                     if (RES.errcode === 0) {
//                         var U_id = RES.data.id;
//                         console.log(`删除了id为${U_id}的用户`);
//                     }
//                     NotifyPlugin("success", {
//                         title: "删除账号成功",
//                         content: `成功删除了id为${U_id}的用户`,
//                         duration: 5000,
//                     });
//                     // 刷新数据
//                     this.InitTableData();
//                 },
//                 error: function (err) {
//                     NotifyPlugin("error", {
//                         title: "删除账号失败",
//                         content: err,
//                         duration: 5000,
//                     });
//                     console.error(err);
//                 },
//             });
//             if (index == list.length - 1) {
//                 // 清空选择
//                 this.$data.SelectData = [];
//                 this.InitTableData();
//             }
//         }
//     }
// }

/**
 * @EditForm
 * @编辑账号
 */
const EditForm = () => {
    var FORMDATA = EditUserDialogFrom.value
    useRequest({
        url: "/user/edit",
        methods: "POST",
        data: {
            id: FORMDATA.id,
            name: FORMDATA.name,
            code: FORMDATA.code,
            class: FORMDATA.class,
            password: FORMDATA.password ? sha256(FORMDATA.password) : null,
            share_device: FORMDATA.share_device,
            permissions: that.$data.AddUserDialogFrom.permissions,
            group: FORMDATA.group,
            grade: FORMDATA.grade,
            reg_time: new Date(FORMDATA.reg_time).getTime(),
            join_time: new Date(FORMDATA.join_time).getTime(),
        },
        success: function (res) {
            var RES = JSON.parse(res);
            if (RES.errcode === 0) {
                var E_id = RES.data.id;
                NotifyPlugin("success", {
                    title: "编辑账号信息成功",
                    content: `成功编辑了id为${E_id}的账号信息`,
                    duration: 5000,
                });
                console.log(`编辑了id为${E_id}的账号信息`);
                // 刷新数据
                loadTableData()
            }
        },
        error: function (err) {
            NotifyPlugin("error", {
                title: "编辑账号信息失败",
                content: err,
                duration: 5000,
            });
            console.error(err);
        },
    });
    // 关闭dialog
    Dialog_Model.edit = false;
    SelectData = []
    // 还原表单
    EditUserDialogFrom.value = {...defaultDialogData}
}


async function readExcel(file) {
    // 忽略前几行
    const ignoreRows = 2;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.raw); // 读取 Excel 文件
    
    const worksheet = workbook.getWorksheet(1); // 获取第一个工作表

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber <= ignoreRows) return;
        const name = row.values[1]
        const code = row.values[2]
        const classes = row.values[3]
        const grade = row.values[4]
        const group = row.values[5]
        const password = row.values[6]
        const permissions = row.values[7]
        const join_time = row.values[8]
        const share_device = row.values[9]
        const openid = row.values[10]
        const remark = row.values[11]

        console.log(`Row ${rowNumber}:`, row.values); // 打印每一行的数据
    });
}

const uploadFile = (e) => {
    return new Promise(function (resolve, reject) {
        if (!/\.(xls|xlsx)$/.test(e.name.toLowerCase())) {
            NotifyPlugin("error",{
                title: "错误",
                content: "上传格式不正确，请上传xls或者xlsx格式",
            });
            reject({ status: 'fail', error: '上传失败，文件格式不正确', response:{ files: [{ name: e.name }] } });
        }
        try{
            readExcel(e)
            resolve({ status: 'success', response:{ files: [{ name: e.name }] }})
        }
        catch(error){
            reject({ status: 'fail', error: `解析文件失败，${error}`, response:{ files: [{ name: e.name }] } });
        }
    })
}

const exportToXlsx = () => {
    async function createExcel() {
        const headerStyle = {
            font: {
                name: 'Arial',
                family: 4,
                size: 12,
                bold: true,
                // color: { argb: 'FF0000' }
            },
            fill: {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'A0C2FA' },
            },
            alignment: {
                vertical: 'middle',
                horizontal: 'center',
                wrapText: true,
            },
            border: {
                top: {style: 'thin', color: {argb: '000000'}},
                left: {style: 'thin', color: {argb: '000000'}},
                bottom: {style: 'thin', color: {argb: '000000'}},
                right: {style: 'thin', color: {argb: '000000'}}
            }
        };

        const bodyStyle = {
            font: {
                name: '黑体',
                family: 4,
                size: 12,
                bold: true,
            },
            alignment: {
                vertical: 'middle',
                horizontal: "center",
                wrapText: true,
            },
            border: {
                top: {style: 'thin', color: {argb: '000000'}},
                left: {style: 'thin', color: {argb: '000000'}},
                bottom: {style: 'thin', color: {argb: '000000'}},
                right: {style: 'thin', color: {argb: '000000'}}
            }
        }

        const headerRow = [
        {
            key: 'id',
            label: 'id',
            width: 6.5
        },
        {
            key: 'code',
            label: '用户Code',
            width: 20
        },
        {
            key: 'name',
            label: '姓名',
            width: 14
        },
        {
            key: 'class',
            label: '班级',
            width: 16
        },
        {
            key: 'grade',
            label: '年级',
            width: 12
        },
        {
            key: 'group',
            label: '组别',
            width: 14
        },
        {
            key: 'reg_time',
            label: '注册时间',
            width: 27
        },
        {
            key: 'join_time',
            label: '加入时间',
            width: 22
        },
        {
            key: 'password',
            label: '密码',
            width: 17
        },
        {
            key: 'share_device',
            label: '共享设备数',
            width: 6.5
        },
        {
            key: 'openid',
            label: '微信openid',
            width: 18
        },
        {
            key: 'remark',
            label: '备注',
            width: 26
        }
        ]

        const workbook = new ExcelJS.Workbook();
        const ws = workbook.addWorksheet("Sheet1")
        ws.addRow(headerRow.map(it=>it.label))
            .eachCell((cell) => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                cell.style = headerStyle
            })
        table_Data.value.forEach(it=> {
            // 特殊组标记
            const unUsual = ['老师','保留用户','系统用户']
            const isUnusual = unUsual.includes((groupOptions.value.find(item => item.value === it.group )?.label ?? ""))
            const w = ws.addRow(Object.values({
                id: it.id,
                code: it.code,
                name: it.name,
                class: it.class,
                grade: it.grade,
                group: groupOptions.value.find(item => item.value === it.group )?.label ?? "",
                reg_time: dayjs(it.reg_time).format('YYYY-MM-DD HH:mm:ss'),
                join_time: dayjs(it.join_time).format('YYYY-MM-DD'),
                password: it.password,
                share_device: it.share_device,
                openid: it.openid,
                remark: it.remark
            }))
            w.height = 40
            w.eachCell({includeEmpty: true},(cell,colNumber) => {
                if(colNumber === 1){
                    cell.style = {
                        fill: {       
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'A0C2FA' },
                        },
                        ...bodyStyle
                    }
                }
                else if (isUnusual) {
                    cell.style = {
                        fill: {       
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFF5EE' },
                        },
                        ...bodyStyle
                    }
                }
                else{
                    cell.style = bodyStyle
                }
            })
        })

        const lastRow = ws.addRow([`本数据表由媒体部管理系统导出，导出时间：${dayjs().format('YYYY-MM-DD HH:mm:ss')}`])
        lastRow.height = 55
        lastRow.eachCell({includeEmpty: true},(cell,colNumber) => {
            cell.style = {
                fill: {       
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'F5DEB3' },
                },
                ...bodyStyle
            }
        })
        // 合并最后一行
        const aToZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        ws.mergeCells(`A${ws.rowCount}:${aToZ[headerRow.length-1]}${ws.rowCount}`)

        ws.columns = headerRow.map((header) => ({
            header: header.label,
            key: header.label,
            width: header.width
        }))

        workbook.xlsx.writeBuffer()
            .then(buffer => {
                // 创建 Blob 对象
                const blob = new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});

                // 创建下载链接
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `媒体部管理系统-人员名单.${dayjs().format("YYMMDD")}.xlsx`;
                a.click();

                // 清理 URL
                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                    a.remove();
                }, 100);
            })
            .catch(err => console.error('Error creating file:', err));
    }
    createExcel()
}

/**
 * @submitForm
 * @提交 新增账号或编辑账号
 */
const submitForm = () => {
    const isEditMode = actionMode.value === "edit"

    // 提交的数据->只有模式为编辑模式时才会有id
    const FORMDATA = {
        id: isEditMode ? EditUserDialogFrom.value.id : null,
        name: EditUserDialogFrom.value.name,
        code: EditUserDialogFrom.value.code,
        class: EditUserDialogFrom.value.class,
        password: EditUserDialogFrom.value.password ? sha256(EditUserDialogFrom.value.password) : null,
        share_device: EditUserDialogFrom.value.share_device,
        group: EditUserDialogFrom.value.group,
        grade: EditUserDialogFrom.value.grade,
        reg_time: dayjs(EditUserDialogFrom.value.reg_time).toString(),
        join_time: dayjs(EditUserDialogFrom.value.join_time).toString(),
        permissions_open: Object.keys(permissionsTransfer.proxyStatus).filter(key => permissionsTransfer.proxyStatus[key].open),
        permissions_close: Object.keys(permissionsTransfer.proxyStatus).filter(key => !permissionsTransfer.proxyStatus[key].open),
    }
    console.log(FORMDATA)

    // useRequest({
    //     url: "/user/edit",
    //     methods: "POST",
    //     data: FORMDATA,
    //     success: function (res) {
    //         var RES = JSON.parse(res);
    //         if (RES.errcode === 0) {
    //             var E_id = RES.data.id;
    //             NotifyPlugin("success", {
    //                 title: "编辑账号信息成功",
    //                 content: `成功编辑了id为${E_id}的账号信息`,
    //                 duration: 5000,
    //             });
    //             console.log(`编辑了id为${E_id}的账号信息`);
    //             // 刷新数据
    //             loadTableData()
    //         }
    //     },
    //     error: function (err) {
    //         NotifyPlugin("error", {
    //             title: "编辑账号信息失败",
    //             content: err,
    //             duration: 5000,
    //         });
    //         console.error(err);
    //     },
    // });
}

const sortChange = (e) => {
    table_Sort.value = e;
    TableSortData();
}

const TableSortData = () => {
    var data = table_Data.value;
    var sort = table_Sort.value;
    if (sort) {
        table_Data.value = data
            .concat()
            .sort((a, b) =>
                sort.descending ? Intl.Collator('zh-Hans-CN', { sensitivity: 'accent' }).compare(a[sort.sortBy], b[sort.sortBy]) : Intl.Collator('zh-Hans-CN', { sensitivity: 'accent' }).compare(b[sort.sortBy], a[sort.sortBy])
            );
    } else {
        table_Data.value = table_BackData.value;
    }
}

const handleTableSelectChange = (value, { selectedRowData }) => {
    SelectData.value = selectedRowData
}

const onPageChange = (pageInfo, context) => {
    table_Pagination.value.current = pageInfo.current;
    table_Pagination.value.pageSize = pageInfo.pageSize;
}

onMounted(() => {
    loadUserPermissions()
    loadSystemPermissionsList()
    loadTableData()
    loadGroupData()
})


</script>

<script lang="tsx">
// import * as XLSX from "xlsx";
export default {
    name: "UserManage",
};
</script>

<style lang="scss">
.t-dialog__body:has(mtb-tag[TAG]) {
    padding-bottom: 0px !important;
}

div[required]::before {
    content: "*";
    color: red;
    padding-right: 6px;
}

div[required] {
    display: flex;
    align-items: center;
}

div[unrequired]::before {
    content: " ";
    width: 12.36px;
}

div[unrequired] {
    display: flex;
    align-items: center;
}

.t-transfer {
    &.transfer-horizontal {
        gap: 8px;
        flex-direction: column-reverse;
        * {
            user-select: none
        }
        .t-transfer__list-header {
            width: calc(100% - var(--td-comp-margin-s) * 2) !important;
        }
        .t-transfer__list-content .t-checkbox-group {
            flex-direction: row !important;
            padding: 0 12px;
            .t-checkbox {
                margin-right: 0px !important;
                margin-left: 0px !important;
            }
            .UserCanTSelect {
                user-select: none;
            }
        }
        &.t-transfer__footer .t-transfer__list {
            &:has(.transfer-footer--tagGroup){
                padding-bottom: 54.67px !important;
            }
            padding-bottom: 0px;
        }
        .t-transfer__list {
            height: 186px !important;
        }
        .t-transfer__list-source {
            padding-bottom: 0px !important;
        }
        .t-transfer__list-target {
            .transfer-footer--tagGroup {
                padding: 12px;
                border-top: 1px solid #e7e7e7;
                height: 30.67px;
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                overflow: auto;
                .group-permission--item {
                    transition: background-color 0.2s cubic-bezier(0.38, 0, 0.24, 1);
                    display: flex;
                    cursor: pointer;
                    border-radius: var(--td-radius-default);
                    padding: var(--td-comp-paddingLR-xs) var(--td-comp-paddingLR-s);
                    &:hover {
                        background: var(--td-bg-color-container-hover);
                    }
                }
            }
        }
        .t-transfer__operations {
            justify-content: center;
            flex-direction: row !important;
            .t-icon {
                transform: rotate(-90deg);
            }
        }
    }
}

</style>