<template>
    <!---->
    <div style="margin-top: 16px;">
        <t-table row-key="id" :columns="table_Columns" :data="table_Data" select-on-row-click cellEmptyContent="-" bordered
            :reserveSelectedRowOnPaginate="false" @select-change="handleTableSelectChange" @page-change="onPageChange" :loading="TableLoading"
            :pagination="table_Pagination">
        </t-table>
    </div>
</template>

<script lang="tsx" setup>
import { InfoCircleIcon } from 'tdesign-icons-vue-next';
import { config } from "../../components/config";
import { NotifyPlugin } from "tdesign-vue-next";
import useRequest from '../../hooks/useRequest';
import { getToken } from '../../hooks/common';
import { computed, onMounted, ref } from 'vue';

const table_Columns = [
    { colKey: "id", title: "借出编号", width: "100" },
    { colKey: "lender", title: "借出人", width: "160",align: "center" },
    { colKey: "user", title: "使用人", width: "160",align: "center" },
    { colKey: "eqname", title: "设备名称", width: "200",align: "center"},
    { colKey: "eqcode", title: "设备Code", width: "200",align: "center" },
    { colKey: "lendtime", title: "借出时间", width: "220",align: "center" },
    { colKey: "returner", title: "归还人", width: "160",align: "center" },
    { colKey: "returntime", title: "归还时间", width: "220",align: "center" },
    { colKey: "remark", title: "备注", align: "center" },
    {
        colKey: "status", title: "状态", width: "240",align: "center",
        cell: (h, { row }) => {
            return (
                <t-tag theme={row.status == 0 ? 'success' : row.status == 1 ? 'warning' : 'danger'} variant="light-outline">
                    {row.status == 0 ? '归档' : row.status == 1 ? '未归还' : row.status}
                </t-tag>
            );
        },
    },
]
const table_Data = ref([])
const SelectData = ref([])
const Total = ref(0)
const TableLoading = ref(false)
const table_Pagination = computed(() => {
    {
        return {
            current: 1,
            pageSize: 25,
            pageSizeOptions: [25, 75, 100, 175],
            total: Total.value,
            showJumper: true,
        }
    }
})
const loadTotal = () => {
    var TOKEN = getToken()
    try {
        useRequest({
            url: "/record/count",
            methods: "POST",
            header: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                token: TOKEN,
            },
            success: function (res) {
                var RES = JSON.parse(res);
                if (RES.errcode == 0) {
                    Total.value = RES.data.total
                }
                else{
                    NotifyPlugin("error", {
                        title: "获取设备借出列表总数失败",
                        content: RES.errmsg,
                        duration: 5000,
                    });
                }
            },
            error: function (err) {
                console.error(err);
                NotifyPlugin("error", {
                    title: "获取设备借出列表总数失败",
                    content: err,
                    duration: 5000,
                });
            },
        });
    } catch (e) {
        console.log(e);
    }
}

const loadData = () => {
    var TOKEN = getToken()
    TableLoading.value = true
    try {
        useRequest({
            url: "/record/listV2",
            methods: "POST",
            header: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                token: TOKEN,
            },
            data: {
                limit: table_Pagination.value.pageSize,
                offset: (table_Pagination.value.current - 1) * table_Pagination.value.pageSize,
            },
            success: function (res) {
                var RES = JSON.parse(res);
                TableLoading.value = false
                if (RES.errcode == 0) {
                    // 数据倒序
                    table_Data.value = RES.data
                }
                else{
                    NotifyPlugin("error", {
                        title: "获取设备借出列表失败",
                        content: RES.errmsg,
                        duration: 5000,
                    });
                }
            },
            error: function (err) {
                TableLoading.value = false
                console.error(err);
                NotifyPlugin("error", {
                    title: "获取设备借出列表失败",
                    content: err,
                    duration: 5000,
                });
            },
        });
    } catch (e) {
        console.log(e);
        TableLoading.value = false
    }
}

const handleTableSelectChange = (value, { selectedRowData }) => {
    SelectData.value = selectedRowData;
}

const onPageChange = (pageInfo, context) => {
    table_Pagination.value.current = pageInfo.current;
    table_Pagination.value.pageSize = pageInfo.pageSize;
    loadData()
}

onMounted(() => {
    loadTotal()
    loadData()
})
</script>

<script lang="tsx">
export default {
    name: "LendList",
};
</script>

<style></style>
