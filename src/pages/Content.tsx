
import { defineComponent } from 'vue';
import { routerMap } from '../components/config';
import "../assets/Content.scss"
import { RouteMaps } from '../types/type';
import { merge } from 'echarts/types/src/export/api/util.js';

export default defineComponent({
    name: "Content",
    props: {
        handleChangeComponent: {
            type: Function,
        },
    },
    setup(props) {
        function arrayAllItemIsNull(arr) {
            return arr.every(item => item === null)
        }

        // function renderMenu(items:RouteMaps,deep:number=0) {
        //     return items.map(item => {
        //         const isSubMenu = item?.children && item?.children.length > 0;
        //         const isHidden = item?.hidden === true;
        
        //         if (isHidden) return null;

                
        //         if (isSubMenu) {
        //             var subMenu = renderMenu(item.children,deep+1);
        //             if (deep === 0) {
        //                 subMenu.sort((a, b) => {
        //                     return a.children.length - b.children.length;
        //                 })
        //             }
        //             if (arrayAllItemIsNull(subMenu)) return null;
        //             return (
        //                 <>
        //                 <div class="componentRow" style={"--deep:"+deep}>
        //                     <div class="componentTitle">{item.label}</div>
        //                     <div class="componentChild" style={"--deep:"+deep}>{ subMenu }</div>
        //                 </div>
        //                 </>
        //             );
        //         }
        //         return <div id={item.key} class="componentItem" style={"--deep:"+deep}>{item.label}</div>;
        //     });
        // }
        function renderMenu(items: RouteMaps, deep: number = 0) {
            // 提取有孙子项的子项
            function extractSubItemsWithGrandChildren(items: RouteMaps) {
                let subItemsWithGrandChildren: RouteMaps = [];
                let remainingItems: RouteMaps = [];

                items.forEach(item => {
                    if (item.children && item.children.some(child => child.children && child.children.length > 0)) {
                        subItemsWithGrandChildren.push(item);
                    } else {
                        remainingItems.push(item);
                    }
                });

                return [subItemsWithGrandChildren, remainingItems];
            }

            // 处理子项
            function processItems(items: RouteMaps, deep: number) {
                if (deep === 0) {
                    const [subItemsWithGrandChildren, remainingItems] = extractSubItemsWithGrandChildren(items);
                    items = [...remainingItems, ...subItemsWithGrandChildren];
                }
            
                return items.map(item => {
                    const isSubMenu = item?.children && item?.children.length > 0;
                    const isHidden = item?.hidden === true;
            
                    if (isHidden) return null;
            
                    if (isSubMenu) {
                        const subMenu = renderMenu(item.children, deep + 1);
                        if (arrayAllItemIsNull(subMenu)) return null;
            
                        if (deep === 0 && item.children.some(child => child.children && child.children.length > 0)) {
                            return (
                                <>
                                    {/* <div class="componentSameRoot"> */}
                                        <div class="componentRow" style={`--deep:${deep}`}>
                                            <div class="componentTitle">{item.label}</div>
                                            <div class="componentChild" style={`--deep:${deep}`}>
                                                {subMenu.filter(subItem => !subItem.props || !subItem.props.class.includes('componentRow'))}
                                            </div>
                                        </div>
                                        {/* <div class="componentSubGroup"> */}
                                            {subMenu.filter(subItem => subItem.props && subItem.props.class.includes('componentRow'))}
                                        {/* </div> */}
                                    {/* </div> */}
                                </>
                            );
                        }
            
                        return (
                            <div class="componentRow" style={`--deep:${deep}`}>
                                <div class="componentTitle">{item.label}</div>
                                <div class="componentChild" style={`--deep:${deep}`}>{subMenu}</div>
                            </div>
                        );
                    }
            
                    return (
                        <div id={item.key} class="componentItem" style={`--deep:${deep}`}>
                            <div class="componentItem--inner" onClick={()=> props?.handleChangeComponent(item.key,true)}>{item.label}</div>
                        </div>
                        );
                }).filter(Boolean); // 过滤掉 null 值
            }

            return processItems(items, deep);
        }

        return () => (
            <div class="componentView">
                {renderMenu(routerMap)}
            </div>
        )
    }
})