import { computed, defineComponent, ref, watch, toRefs, reactive } from "vue"
import { PermissionsArray, PermissionsObject, PermissionsTransferType } from "../types/type"
import "./style/permissionsTransfer.scss"

// TODO: 有点小问题 后面可能需要用vue重写，tsx特性

export default defineComponent({
    name: "PermissionsTransfer",
    props: {
        data: {
            type: Array<PermissionsObject>,
        },
        value: {
            type: Array<PermissionsObject>,
        },
        user: {
            type: Array<PermissionsObject>,
            default: []
        },
        group: {
            type: Array<PermissionsObject>,
            default: []
        }
    },
    setup(props) {

        const { data, value, user, group } = toRefs(props)
        const TARTGET = "target"
        const SOURCE = "source"
        // TD组件只接受含value和label的Array<object>，所以要转换！
        const checkedValue = reactive({
            [TARTGET]: [],
            [SOURCE]: []
        })
        // 值不对称，将user和group的object替换成data的object
        const userData = computed(() => {
            return user.value.map(u => {
                return {
                    ...u,
                    object: data.value.find(item => item.val === u.val)?.object
                }
            })
        })
        // const groupData = computed(() => {
        //     return group.value.map(g => {
        //         return {
        //             ...g,
        //             object: data.value.find(item => item.val === g.val)?.object
        //         }
        //     })
        // })

        // 数据监听
        watch(
            () => props.user,
            (val) => {
                user.value = val
                transferTo(TARTGET,userData.value)
            },
            { immediate: true }
        );

        /**
         * @filterData
         * @param data 数据项
         * @param filterValue 过滤值
         * @param mode 筛选模式，true为正向筛选 false为反向筛选
         */
        function filterData(data:PermissionsArray, filterValue: PermissionsArray,mode:boolean=true){
            if (mode) {
                return data.filter(item => !filterValue.some(filterItem => filterItem.val === item.val))
            }
            return data.filter(item => filterValue.some(filterItem => filterItem.val === item.val))
        }

        // 
        function transferTo(toDirection: PermissionsTransferType, useThisCheckedData: PermissionsArray = null) {
            // 目标ref
            const targetData = toDirection === TARTGET ? value : data
            // 来源ref
            const sourceData = toDirection === TARTGET ? data : value
            // 是否使用自定义数据（初始化用户已有权限）
            const isInitUserPermission = useThisCheckedData ? true : false
            // 选中内容，应为反向的toDirection
            var checkedData = useThisCheckedData ?? (toDirection === TARTGET ? checkedValue[SOURCE] : checkedValue[TARTGET])
            // 若不是初始化用户权限，则checkedData为Array对象，需要组合数据，源数据 应是 来源ref
            if (!isInitUserPermission) {
                checkedData = checkedData.map(item => {
                    return {
                        val: item,
                        object: sourceData.value.find(sd => sd.val === item)?.object,
                        open: true
                    }
                })
            }
            // checkedData添加至目标ref
            targetData.value.splice(0, targetData.value.length)
            checkedData.forEach(item => {
                targetData.value.push(item)
            })
            // 来源ref删除每一个checkedData
            const backupSource = JSON.parse(JSON.stringify(sourceData.value))
            sourceData.value.splice(0, sourceData.value.length)
            filterData(backupSource, checkedData, true).forEach(item => {
                sourceData.value.push(item)
            })
        }

        function transferToTarget() {
            transferTo(TARTGET)
        }

        function transferToSource() {
            transferTo(SOURCE)
        }

        /**
         * 渲染组权限（非编辑）
         */
        function renderGroupView() {
            const groupData = computed(() => {
                return group.value.map(g => {
                    return {
                        ...g,
                        object: data.value.find(item => item.val === g.val)?.object
                    }
                })
            })
            return (
                <div class="t-checkbox-group group-data">
                    { groupData.value.map(item => {
                        return (
                            <div class="transfer__list-item">
                                <span>
                                    <t-popup content="此权限为组权限，若要管理此权限，请前往'组管理'页面">
                                        <t-tag style="margin-right: 4px;" shape="mark" size="small" color="rgb(168, 47, 104)" variant="light-outline">组</t-tag>
                                        { item.object ?? item.val }
                                    </t-popup>
                                </span>
                            </div>
                        )
                    })}
                </div>
            )
        }

        // 操作按钮
        function renderOperation() {
            return (
                <>
                    <t-button size="small" variant="outline" theme="primary" onClick={() => { transferToTarget() }}>添加</t-button>
                    <t-button size="small" variant="outline" theme="primary" onClick={() => { transferToSource() }}>移除</t-button>
                </>
            )
        }

        // 渲染穿梭框视图
        function renderTransferView(direction: PermissionsTransferType) {
            // 通用渲染函数，需要区分target和source渲染
            const dataValue = direction === TARTGET ? value : data
            const checkBoxOption = dataValue.value.map(item => {
                return {
                    label: item.object,
                    value: item.val
                }
            })
            const checkBoxOptionArray = dataValue.value.map(item => {
                return item.val
            })
            var El = []
            for (const item in checkBoxOption) {
                const element = checkBoxOption[item];
                El.push(<t-checkbox class="transfer__list-item" key={element.value} value={element.value}>{element.label}</t-checkbox>)
            }
            return (
                <>
                    <div class="transfer__list-header">
                        <div>
                            <t-checkbox
                                checked={checkedValue[direction].length === checkBoxOption.length && checkedValue[direction].length !== 0}
                                indeterminate={checkedValue[direction].length > 0 && checkedValue[direction].length < data.value.length}
                                onChange={(checked) => { checked ? checkedValue[direction] = checkBoxOptionArray : checkedValue[direction] = [] }}>
                            </t-checkbox>
                            <span>{checkedValue[direction].length} / {checkBoxOption.length} 项</span>
                        </div>
                    </div>
                    <div class="transfer__list-body">
                        <div class="transfer__list-content narrow-scrollbar">
                            <t-checkbox-group v-model={checkedValue[direction]} onChange={() => { console.log(checkedValue) }} >
                                {El}
                            </t-checkbox-group>
                            { direction === TARTGET ? (
                                renderGroupView()
                            ) : null }
                        </div>
                    </div>
                </>
            )
        }

        function renderValueTransferView() {
            // 通用渲染函数，需要区分target和source渲染
            const checkBoxOption = value.value.map(item => {
                return {
                    label: item.object,
                    value: item.val,
                    open: item.open
                }
            })
            const checkBoxOptionArray = value.value.map(item => {
                return item.val
            })
            var El = []
            for (const item in checkBoxOption) {
                const element = checkBoxOption[item];
                El.push(<t-checkbox class="transfer__list-item" key={element.value} value={element.value}>{element.label ?? element.value}</t-checkbox>)
            }
            return (
                <>
                    <div class="transfer__list-header">
                        <div>
                            <t-checkbox
                                checked={checkedValue[TARTGET].length === checkBoxOption.length && checkedValue[TARTGET].length !== 0}
                                indeterminate={checkedValue[TARTGET].length > 0 && checkedValue[TARTGET].length < data.value.length}
                                onChange={(checked) => { checked ? checkedValue[TARTGET] = checkBoxOptionArray : checkedValue[TARTGET] = [] }}>
                            </t-checkbox>
                            <span>{checkedValue[TARTGET].length} / {checkBoxOption.length} 项</span>
                        </div>
                    </div>
                    <div class="transfer__list-body">
                        <div class="transfer__list-content narrow-scrollbar">
                            <t-checkbox-group v-model={checkedValue[TARTGET]} onChange={() => { console.log(checkedValue) }} >
                                {El}
                            </t-checkbox-group>
                            {renderGroupView()}
                        </div>
                    </div>
                </>
            )
        }

        // 最终渲染
        function renderAll() {
            return (
                <div class="permissions-transfer">
                    <div class="transfer-list transfer--value">{ renderValueTransferView() }</div>
                    <div class="transfer--operation">{renderOperation()}</div>
                    <div class="transfer-list transfer--data">{ renderTransferView(SOURCE) }</div>
                </div>
            )
        }

        return () => (
            <div>
                { renderAll() }
            </div>
        )
    },
})