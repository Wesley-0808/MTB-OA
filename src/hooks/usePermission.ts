import { getToken } from "./common";
import useRequest from "./useRequest";
import isString from "lodash/isString";
import isArray from "lodash/isArray";

export var userPermissions = []

export function getUserPermissions() {
    return new Promise((resolve, reject) => {
        if (userPermissions.length > 0) {
            resolve(userPermissions)
        }
        else {
            loadUserPermissions().then(res => {
                resolve(res)
            }).catch(err => {
                reject(err)
            })
        }
    })
}

export function loadUserPermissions(): Promise<Array<string>|string> {
    return new Promise((resolve, reject) => {
        useRequest({
            url: "/permissions/userHasPermissions",
            methods: "POST",
            success: function (res) {
                var RES = JSON.parse(res);
                if (RES.errcode == 0) {
                    userPermissions = RES.data
                    resolve(RES.data)
                }
                reject(RES)
            },
            error: function (err) {
                console.error(err);
                reject(err)
            },
        })
    })
}

export function loadSystemPermissions() {
    return new Promise((resolve, reject) => {
        useRequest({
            url: "/permissions/systemlist",
            methods: "POST",
            success: function (res) {
                var RES = JSON.parse(res);
                if (RES.errcode == 0) {
                    resolve(RES.data)
                }
                else {
                    reject(RES)
                }
            },
            error: function (err) {
                console.error(err);
                reject(err)
            }
        })
    })
}

export function loadUserPermissionsList() {
    return new Promise((resolve, reject) => {
        useRequest({
            url: "/permissions/userlist",
            methods: "POST",
            success: function (res) {
                var RES = JSON.parse(res);
                if (RES.errcode == 0) {
                    resolve(RES.data)
                }
                else {
                    reject(RES)
                }
            },
            error: function (err) {
                console.error(err);
                reject(err)
            }
        })
    })
}

/**
 * @param needPermissions 
 * 检查用户权限、匹配用户权限
 * 传入值为Array则会判断用户权限是否包含在该数组内，包含其一就会返回true
 * 权限合法值：a.b a.b.c
 * @returns boolean
 */
export function checkPermission(needPermissions: string | Array<string>) {
    if (isString(needPermissions)) {
        return userPermissions.includes(needPermissions)
    }
    if (isArray(needPermissions)) {
        if (needPermissions.length == 0) {
            return true
        }
        // 遍历needPermissions
        needPermissions.forEach(item => {
            if (userPermissions.includes(item) || userPermissions.includes("*.*")) {
                return true
            }
            // 判断是否有某权限的根权限
            const permissionItem = item.split(".")
            var p = ""
            for (const i in permissionItem) {
                const element = permissionItem[i];
                p = p + element
                if (userPermissions.includes(p)) {
                    return true
                }
            }
        })
    }
    return false
}