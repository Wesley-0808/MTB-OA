import { defineComponent, ref, toRefs, watch, computed, h } from "vue";
import { taskStatus, taskType } from "../../hooks/common";
import { Table } from "tdesign-vue-next";

export default defineComponent({
    name: "TaskListRender",
    props: {
        data: {
            type: Object,
            required: true,
        },
        tabs: {
            type: Array,
            required: true,
        },
        currentTab: {
            type: String,
            required: true,
        },
        showCompleted: {
            type: Boolean,
            default: true,
        }
    },
    setup(props, ctx) {
        const { data, tabs, currentTab, showCompleted: showCompletedProp } = toRefs(props);

        const renderData = ref({});
        const showCompleted = ref(showCompletedProp.value);

        watch(currentTab, (newVal) => {
            updateRenderData();
        });

        watch(data, (newVal) => {
            updateRenderData();
            data.value = newVal;
        });

        watch(showCompletedProp, (newVal) => {
            showCompleted.value = newVal;
        });

        const updateRenderData = () => {
            renderData.value = {};
            renderData.value = data.value[currentTab.value] || {};
        };

        const Options = {
            type: taskType,
            status: taskStatus,
        };

        const TableColumns = {
            type: [
                { colKey: "id", title: "Tid", width: 55 },
                { colKey: "name", title: "任务名称", minWidth: 80 },
                { colKey: "work_time", title: "工作时间", width: 200 },
                { colKey: "finally_time", title: "预期完成时间", minWidth: 80 },
                { colKey: "place", title: "工作地点", minWidth: 80 },
                { colKey: "content", title: "工作内容", minWidth: 80 },
                {
                    colKey: "status",
                    title: "任务状态",
                    width: 92,
                    align: "center",
                    cell: (h, { row }) => {
                        const tag = findVal(row.status, 'status');
                        return (
                            <t-tag theme={tag?.theme} color={tag?.color} variant="light-outline">{tag?.label ?? row.status}</t-tag>
                        );
                    },
                },
                {
                    colKey: "user",
                    title: "分配人员",
                    width: 210,
                    cell: (h, { row }) => {
                        return stringToTagList(row.user);
                    }
                },
                {
                    colKey: "equipment",
                    title: "所需设备",
                    minWidth: 80,
                    cell: (h, { row }) => {
                        return stringToTagList(row.equipment);
                    }
                },
                {
                    colKey: "weight",
                    title: "权重",
                    width: 100,
                    align: "center",
                    cell: (h, { row }) => {
                        return (
                            <div>Level {row.weight}</div>
                        );
                    }
                },
                { colKey: "create_user", title: "发布人", width: 75 },
                { colKey: "remark", title: "备注", width: 100 },
            ],
            status: [
                { colKey: "id", title: "Tid", width: 55 },
                { colKey: "name", title: "任务名称", minWidth: 80 },
                { colKey: "work_time", title: "工作时间", width: 200 },
                { colKey: "finally_time", title: "预期完成时间", minWidth: 80 },
                { colKey: "place", title: "工作地点", minWidth: 80 },
                { colKey: "content", title: "工作内容", minWidth: 80 },
                {
                    colKey: "type",
                    title: "任务类型",
                    width: 92,
                    align: "center",
                    cell: (h, { row }) => {
                        const tag = findVal(row.type, 'type');
                        return (
                            <t-tag theme={tag?.theme} color={tag?.color} variant="light-outline">{tag?.label ?? row.type}</t-tag>
                        );
                    },
                },
                {
                    colKey: "user",
                    title: "分配人员",
                    width: 210,
                    cell: (h, { row }) => {
                        return stringToTagList(row.user);
                    }
                },
                {
                    colKey: "equipment",
                    title: "所需设备",
                    minWidth: 80,
                    cell: (h, { row }) => {
                        return stringToTagList(row.equipment);
                    }
                },
                {
                    colKey: "weight",
                    title: "权重",
                    width: 100,
                    align: "center",
                    cell: (h, { row }) => {
                        return (
                            <div>Level {row.weight}</div>
                        );
                    }
                },
                { colKey: "create_user", title: "发布人", width: 75 },
                { colKey: "remark", title: "备注", width: 100 },
            ],
        };

        const stringToTagList = (str) => {
            if (str === "") {
                return "";
            }
            const list = str?.split(",") ?? [];
            const div = list.map(item => {
                return (
                    <t-tag>{item}</t-tag>
                );
            });
            return (
                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                    {div}
                </div>
            );
        };

        const getTagPriority = (item) => {
            // 优先级：2 > 1 > 0 > 3
            return item == 2 ? 0 : item == 1 ? 1 : item == 3 ? 3 : 2;
        };

        const findVal = (val: string | number, mode) => {
            for (const key in Options[mode]) {
                const item = Options[mode][key];
                if (item.value == val || Number(item.value) == val) {
                    return item;
                }
            }
            return null;
        };

        const renderTagAndTable = (item) => {
            const keys = Object.keys(renderData.value);
            return keys.map(key => {
                const tag = findVal(key, item);
                const tableData = renderData.value[key].filter(row => {
                    if (!showCompleted.value && row.status === 6) {
                        return false;
                    }
                    return true;
                });

                if (tableData.length === 0) {
                    return null;
                }
                
                return (
                    <div class="tag_items" style={`order: ${getTagPriority(key)}`}>
                        <div class="title_tag">
                            <t-tag theme={tag?.theme} color={tag?.color} variant="light-outline">{tag.label}</t-tag>
                        </div>
                        <t-table class="hidden--head" columns={TableColumns[item]} data={tableData} bordered></t-table>
                    </div>
                );
            }).filter(Boolean);
        };
        
        const renderInner = (item) => {
            const renderTable = renderTagAndTable(item)
            return (
                <div class="Table--view">
                    { 
                        h(Table, { class: renderTable.length !== 0 ? 'hidden--body' : null, columns: TableColumns[item], bordered: true }, {
                            empty: () => "暂时没有任务哦！",
                        })
                    }
                    <div class="tag--body">
                        {renderTable}
                    </div>
                </div>
            );
        };

        const renderView = () => {
            updateRenderData();
            return (
                <div>
                    {tabs.value.map(item => (
                        currentTab.value === item ? (
                            <div id={item}>
                                {renderInner(item)}
                            </div>
                        ) : null
                    ))}
                </div>
            );
        };

        return () => (
            <div>
                {renderView()}
            </div>
        );
    },
});