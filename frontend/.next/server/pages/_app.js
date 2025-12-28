/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "./components/AuthContext.js":
/*!***********************************!*\
  !*** ./components/AuthContext.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   AuthProvider: () => (/* binding */ AuthProvider),\n/* harmony export */   useAuth: () => (/* binding */ useAuth)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n\n\nconst AuthContext = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_1__.createContext)();\nfunction AuthProvider({ children }) {\n    const [user, setUser] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);\n    const [loading, setLoading] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(true);\n    // Check if user is logged in on app start\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        const token = localStorage.getItem(\"token\");\n        const userData = localStorage.getItem(\"user\");\n        if (token && userData) {\n            try {\n                const parsedUser = JSON.parse(userData);\n                setUser(parsedUser);\n            } catch (error) {\n                // Invalid user data, clear storage\n                localStorage.removeItem(\"token\");\n                localStorage.removeItem(\"user\");\n            }\n        }\n        setLoading(false);\n    }, []);\n    const login = (token, userData)=>{\n        localStorage.setItem(\"token\", token);\n        localStorage.setItem(\"user\", JSON.stringify(userData));\n        setUser(userData);\n    };\n    const logout = ()=>{\n        localStorage.removeItem(\"token\");\n        localStorage.removeItem(\"user\");\n        setUser(null);\n    };\n    const isAuthenticated = !!user;\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(AuthContext.Provider, {\n        value: {\n            user,\n            loading,\n            login,\n            logout,\n            isAuthenticated\n        },\n        children: children\n    }, void 0, false, {\n        fileName: \"C:\\\\Users\\\\konhaw\\\\Desktop\\\\Uczelnia\\\\JS\\\\ProjektJS\\\\frontend\\\\components\\\\AuthContext.js\",\n        lineNumber: 43,\n        columnNumber: 5\n    }, this);\n}\nfunction useAuth() {\n    const context = (0,react__WEBPACK_IMPORTED_MODULE_1__.useContext)(AuthContext);\n    if (!context) {\n        throw new Error(\"useAuth must be used within an AuthProvider\");\n    }\n    return context;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9jb21wb25lbnRzL0F1dGhDb250ZXh0LmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBc0U7QUFFdEUsTUFBTUksNEJBQWNKLG9EQUFhQTtBQUUxQixTQUFTSyxhQUFhLEVBQUVDLFFBQVEsRUFBRTtJQUN2QyxNQUFNLENBQUNDLE1BQU1DLFFBQVEsR0FBR04sK0NBQVFBLENBQUM7SUFDakMsTUFBTSxDQUFDTyxTQUFTQyxXQUFXLEdBQUdSLCtDQUFRQSxDQUFDO0lBRXZDLDBDQUEwQztJQUMxQ0MsZ0RBQVNBLENBQUM7UUFDUixNQUFNUSxRQUFRQyxhQUFhQyxPQUFPLENBQUM7UUFDbkMsTUFBTUMsV0FBV0YsYUFBYUMsT0FBTyxDQUFDO1FBRXRDLElBQUlGLFNBQVNHLFVBQVU7WUFDckIsSUFBSTtnQkFDRixNQUFNQyxhQUFhQyxLQUFLQyxLQUFLLENBQUNIO2dCQUM5Qk4sUUFBUU87WUFDVixFQUFFLE9BQU9HLE9BQU87Z0JBQ2QsbUNBQW1DO2dCQUNuQ04sYUFBYU8sVUFBVSxDQUFDO2dCQUN4QlAsYUFBYU8sVUFBVSxDQUFDO1lBQzFCO1FBQ0Y7UUFFQVQsV0FBVztJQUNiLEdBQUcsRUFBRTtJQUVMLE1BQU1VLFFBQVEsQ0FBQ1QsT0FBT0c7UUFDcEJGLGFBQWFTLE9BQU8sQ0FBQyxTQUFTVjtRQUM5QkMsYUFBYVMsT0FBTyxDQUFDLFFBQVFMLEtBQUtNLFNBQVMsQ0FBQ1I7UUFDNUNOLFFBQVFNO0lBQ1Y7SUFFQSxNQUFNUyxTQUFTO1FBQ2JYLGFBQWFPLFVBQVUsQ0FBQztRQUN4QlAsYUFBYU8sVUFBVSxDQUFDO1FBQ3hCWCxRQUFRO0lBQ1Y7SUFFQSxNQUFNZ0Isa0JBQWtCLENBQUMsQ0FBQ2pCO0lBRTFCLHFCQUNFLDhEQUFDSCxZQUFZcUIsUUFBUTtRQUFDQyxPQUFPO1lBQzNCbkI7WUFDQUU7WUFDQVc7WUFDQUc7WUFDQUM7UUFDRjtrQkFDR2xCOzs7Ozs7QUFHUDtBQUVPLFNBQVNxQjtJQUNkLE1BQU1DLFVBQVUzQixpREFBVUEsQ0FBQ0c7SUFDM0IsSUFBSSxDQUFDd0IsU0FBUztRQUNaLE1BQU0sSUFBSUMsTUFBTTtJQUNsQjtJQUNBLE9BQU9EO0FBQ1QiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly92Y3YtbGFuZGluZy1mcm9udGVuZC8uL2NvbXBvbmVudHMvQXV0aENvbnRleHQuanM/ZWJhMSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjcmVhdGVDb250ZXh0LCB1c2VDb250ZXh0LCB1c2VTdGF0ZSwgdXNlRWZmZWN0IH0gZnJvbSAncmVhY3QnXHJcblxyXG5jb25zdCBBdXRoQ29udGV4dCA9IGNyZWF0ZUNvbnRleHQoKVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIEF1dGhQcm92aWRlcih7IGNoaWxkcmVuIH0pIHtcclxuICBjb25zdCBbdXNlciwgc2V0VXNlcl0gPSB1c2VTdGF0ZShudWxsKVxyXG4gIGNvbnN0IFtsb2FkaW5nLCBzZXRMb2FkaW5nXSA9IHVzZVN0YXRlKHRydWUpXHJcblxyXG4gIC8vIENoZWNrIGlmIHVzZXIgaXMgbG9nZ2VkIGluIG9uIGFwcCBzdGFydFxyXG4gIHVzZUVmZmVjdCgoKSA9PiB7XHJcbiAgICBjb25zdCB0b2tlbiA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd0b2tlbicpXHJcbiAgICBjb25zdCB1c2VyRGF0YSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd1c2VyJylcclxuXHJcbiAgICBpZiAodG9rZW4gJiYgdXNlckRhdGEpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBwYXJzZWRVc2VyID0gSlNPTi5wYXJzZSh1c2VyRGF0YSlcclxuICAgICAgICBzZXRVc2VyKHBhcnNlZFVzZXIpXHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgLy8gSW52YWxpZCB1c2VyIGRhdGEsIGNsZWFyIHN0b3JhZ2VcclxuICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndG9rZW4nKVxyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd1c2VyJylcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldExvYWRpbmcoZmFsc2UpXHJcbiAgfSwgW10pXHJcblxyXG4gIGNvbnN0IGxvZ2luID0gKHRva2VuLCB1c2VyRGF0YSkgPT4ge1xyXG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3Rva2VuJywgdG9rZW4pXHJcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndXNlcicsIEpTT04uc3RyaW5naWZ5KHVzZXJEYXRhKSlcclxuICAgIHNldFVzZXIodXNlckRhdGEpXHJcbiAgfVxyXG5cclxuICBjb25zdCBsb2dvdXQgPSAoKSA9PiB7XHJcbiAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndG9rZW4nKVxyXG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3VzZXInKVxyXG4gICAgc2V0VXNlcihudWxsKVxyXG4gIH1cclxuXHJcbiAgY29uc3QgaXNBdXRoZW50aWNhdGVkID0gISF1c2VyXHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8QXV0aENvbnRleHQuUHJvdmlkZXIgdmFsdWU9e3tcclxuICAgICAgdXNlcixcclxuICAgICAgbG9hZGluZyxcclxuICAgICAgbG9naW4sXHJcbiAgICAgIGxvZ291dCxcclxuICAgICAgaXNBdXRoZW50aWNhdGVkXHJcbiAgICB9fT5cclxuICAgICAge2NoaWxkcmVufVxyXG4gICAgPC9BdXRoQ29udGV4dC5Qcm92aWRlcj5cclxuICApXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1c2VBdXRoKCkge1xyXG4gIGNvbnN0IGNvbnRleHQgPSB1c2VDb250ZXh0KEF1dGhDb250ZXh0KVxyXG4gIGlmICghY29udGV4dCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCd1c2VBdXRoIG11c3QgYmUgdXNlZCB3aXRoaW4gYW4gQXV0aFByb3ZpZGVyJylcclxuICB9XHJcbiAgcmV0dXJuIGNvbnRleHRcclxufSJdLCJuYW1lcyI6WyJjcmVhdGVDb250ZXh0IiwidXNlQ29udGV4dCIsInVzZVN0YXRlIiwidXNlRWZmZWN0IiwiQXV0aENvbnRleHQiLCJBdXRoUHJvdmlkZXIiLCJjaGlsZHJlbiIsInVzZXIiLCJzZXRVc2VyIiwibG9hZGluZyIsInNldExvYWRpbmciLCJ0b2tlbiIsImxvY2FsU3RvcmFnZSIsImdldEl0ZW0iLCJ1c2VyRGF0YSIsInBhcnNlZFVzZXIiLCJKU09OIiwicGFyc2UiLCJlcnJvciIsInJlbW92ZUl0ZW0iLCJsb2dpbiIsInNldEl0ZW0iLCJzdHJpbmdpZnkiLCJsb2dvdXQiLCJpc0F1dGhlbnRpY2F0ZWQiLCJQcm92aWRlciIsInZhbHVlIiwidXNlQXV0aCIsImNvbnRleHQiLCJFcnJvciJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./components/AuthContext.js\n");

/***/ }),

/***/ "./pages/_app.js":
/*!***********************!*\
  !*** ./pages/_app.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ App)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../styles/globals.css */ \"./styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _components_AuthContext__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../components/AuthContext */ \"./components/AuthContext.js\");\n\n\n\nfunction App({ Component, pageProps }) {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_components_AuthContext__WEBPACK_IMPORTED_MODULE_2__.AuthProvider, {\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n            ...pageProps\n        }, void 0, false, {\n            fileName: \"C:\\\\Users\\\\konhaw\\\\Desktop\\\\Uczelnia\\\\JS\\\\ProjektJS\\\\frontend\\\\pages\\\\_app.js\",\n            lineNumber: 7,\n            columnNumber: 7\n        }, this)\n    }, void 0, false, {\n        fileName: \"C:\\\\Users\\\\konhaw\\\\Desktop\\\\Uczelnia\\\\JS\\\\ProjektJS\\\\frontend\\\\pages\\\\_app.js\",\n        lineNumber: 6,\n        columnNumber: 5\n    }, this);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9wYWdlcy9fYXBwLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBOEI7QUFDMEI7QUFFekMsU0FBU0MsSUFBSSxFQUFFQyxTQUFTLEVBQUVDLFNBQVMsRUFBRTtJQUNsRCxxQkFDRSw4REFBQ0gsaUVBQVlBO2tCQUNYLDRFQUFDRTtZQUFXLEdBQUdDLFNBQVM7Ozs7Ozs7Ozs7O0FBRzlCIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vdmN2LWxhbmRpbmctZnJvbnRlbmQvLi9wYWdlcy9fYXBwLmpzP2UwYWQiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICcuLi9zdHlsZXMvZ2xvYmFscy5jc3MnXHJcbmltcG9ydCB7IEF1dGhQcm92aWRlciB9IGZyb20gJy4uL2NvbXBvbmVudHMvQXV0aENvbnRleHQnXHJcblxyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBBcHAoeyBDb21wb25lbnQsIHBhZ2VQcm9wcyB9KSB7XHJcbiAgcmV0dXJuIChcclxuICAgIDxBdXRoUHJvdmlkZXI+XHJcbiAgICAgIDxDb21wb25lbnQgey4uLnBhZ2VQcm9wc30gLz5cclxuICAgIDwvQXV0aFByb3ZpZGVyPlxyXG4gIClcclxufVxyXG4iXSwibmFtZXMiOlsiQXV0aFByb3ZpZGVyIiwiQXBwIiwiQ29tcG9uZW50IiwicGFnZVByb3BzIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./pages/_app.js\n");

/***/ }),

/***/ "./styles/globals.css":
/*!****************************!*\
  !*** ./styles/globals.css ***!
  \****************************/
/***/ (() => {



/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("./pages/_app.js"));
module.exports = __webpack_exports__;

})();