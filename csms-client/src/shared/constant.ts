export enum IpcChannel {
  // App
  APP_INFO = 'app:info',
  APP_CLOSE_WINDOW = 'app:closeWindow',
  APP_SHOW_WINDOW = 'app:showWindow',
  APP_QUIT = 'app:quit',

  // CS
  CS_READ_ALL = 'cs:readAll',
  CS_CREATE = 'cs:create',
  CS_EDIT = 'cs:edit',
  CS_REMOVE = 'cs:remove',
  CS_GET_STATUSES = 'cs:getStatuses',
  CS_UPLOAD_LICENSE = 'cs:uploadLicense',
  CS_CREATE_REPLY = 'cs:createReply',
  CS_EDIT_REPLY = 'cs:editReply',
  CS_REMOVE_REPLY = 'cs:removeReply',

  // Item
  ITEM_READ_ALL = 'item:readAll',
  ITEM_CREATE = 'item:create',
  ITEM_EDIT = 'item:edit',
  ITEM_REMOVE = 'item:remove',


  // Setting
  SETTING_GET_SERIAL_PORT_LIST = 'setting:getSerialPortList',
  SETTING_GET_SERIAL_PORT_SETTING = 'setting:getSerialPortSetting',
  SETTING_TOGGLE_SERIAL_PORT = 'setting:toggleSerialPort',
  SETTING_SET_SERIAL_COMMAND = 'setting:setSerialCommand',
  SETTING_SERIAL_PORT_LIST_CHANGED = 'setting:serialPortListChanged',
  SETTING_SERIAL_PORT_DATA = 'setting:serialPortData',
  SETTING_PRINT_DEBUG_CONSOLE = 'setting:printDebugConsole',

  // User
  USER_READ_ALL = 'user:readAll',

  // Native
  NATIVE_MINIMIZE = 'native:minimize',
  NATIVE_MAXIMIZE = 'native:maximize',
  NATIVE_CLOSE = 'native:close',
  NATIVE_IS_MAXIMIZED = 'native:isMaximized',
  NATIVE_MAXIMIZED_CHANGE = 'native:maximizedChange'
}
