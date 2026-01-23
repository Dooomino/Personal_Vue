import { defineStore } from 'pinia';

interface ModuleStatus {
  name: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
  message?: string;
}

interface LoadingModule {
  name: string;
  timeout: number;
  startTime: number;
  timerId?: number;
}

export const useBroadcastStore = defineStore('broadcast', {
  state: () => ({
    modules: {} as Record<string, ModuleStatus>,
    loadingModules: [] as LoadingModule[],
    allLoaded: false,
    overallStatus: 'pending' as 'pending' | 'success' | 'failed',
    registeredCallbacks: [] as Array<(status: string, data?: any) => void>,
  }),

  getters: {
    isAllLoaded(): boolean {
      return this.allLoaded;
    },

    getOverallStatus(): string {
      return this.overallStatus;
    },

    getModuleStatus(): (moduleName: string) => ModuleStatus | undefined {
      return (moduleName: string) => this.modules[moduleName];
    },

    getFailedModules(): ModuleStatus[] {
      return Object.values(this.modules).filter(module => module.status === 'failed');
    },

    getPendingModules(): string[] {
      return Object.values(this.modules)
        .filter(module => module.status === 'pending')
        .map(module => module.name);
    }
  },

  actions: {
    /**
     * 注册一个模块为待加载状态
     * @param moduleName 模块名称
     * @param timeout 超时时间（毫秒），默认为10秒
     */
    registerModule(moduleName: string, timeout: number = 10000): void {
      // 如果模块已经存在，不重复注册
      if (this.modules[moduleName]) {
        return;
      }

      this.modules[moduleName] = {
        name: moduleName,
        status: 'pending',
        timestamp: Date.now(),
      };

      // 设置超时检测
      const loadingModule: LoadingModule = {
        name: moduleName,
        timeout,
        startTime: Date.now(),
      };

      // 设置定时器检查超时
      loadingModule.timerId = window.setTimeout(() => {
        this.markModuleAsFailed(
          moduleName,
          `Module "${moduleName}" timed out after ${timeout}ms`
        );
      }, timeout);

      this.loadingModules.push(loadingModule);

      // 检查是否所有模块都已完成
      this.checkOverallStatus();
    },

    /**
     * 标记模块加载成功
     * @param moduleName 模块名称
     * @param message 可选的消息
     */
    markModuleAsSuccess(moduleName: string, message?: string): void {
      if (!this.modules[moduleName]) {
        console.warn(`Module "${moduleName}" is not registered`);
        return;
      }

      // 清除定时器
      const loadingIndex = this.loadingModules.findIndex(m => m.name === moduleName);
      if (loadingIndex !== -1) {
        const loadingModule = this.loadingModules[loadingIndex];
        if (loadingModule.timerId) {
          clearTimeout(loadingModule.timerId);
        }
        this.loadingModules.splice(loadingIndex, 1);
      }

      this.modules[moduleName] = {
        name: moduleName,
        status: 'success',
        timestamp: Date.now(),
        message
      };

      // 检查是否所有模块都已完成
      this.checkOverallStatus();
    },

    /**
     * 标记模块加载失败
     * @param moduleName 模块名称
     * @param errorMessage 错误消息
     */
    markModuleAsFailed(moduleName: string, errorMessage?: string): void {
      if (!this.modules[moduleName]) {
        console.warn(`Module "${moduleName}" is not registered`);
        return;
      }

      // 清除定时器
      const loadingIndex = this.loadingModules.findIndex(m => m.name === moduleName);
      if (loadingIndex !== -1) {
        const loadingModule = this.loadingModules[loadingIndex];
        if (loadingModule.timerId) {
          clearTimeout(loadingModule.timerId);
        }
        this.loadingModules.splice(loadingIndex, 1);
      }

      this.modules[moduleName] = {
        name: moduleName,
        status: 'failed',
        timestamp: Date.now(),
        message: errorMessage
      };

      // 检查是否所有模块都已完成
      this.checkOverallStatus();
    },

    /**
     * 检查总体状态并更新
     */
    checkOverallStatus(): void {
      const pendingCount = Object.values(this.modules).filter(m => m.status === 'pending').length;

      if (pendingCount === 0) {
        // 所有模块都已完成
        const failedCount = Object.values(this.modules).filter(m => m.status === 'failed').length;

        if (failedCount > 0) {
          this.overallStatus = 'failed';
        } else {
          this.overallStatus = 'success';
        }

        this.allLoaded = true;

        // 触发回调
        this.triggerCallbacks(this.overallStatus);
      } else {
        // 仍有模块未完成
        this.overallStatus = 'pending';
        this.allLoaded = false;
      }
    },

    /**
     * 订阅总体状态变化
     * @param callback 状态变化时的回调函数
     */
    subscribeOverallStatusChange(callback: (status: string, data?: any) => void): void {
      this.registeredCallbacks.push(callback);
    },

    /**
     * 取消订阅总体状态变化
     * @param callback 要取消的回调函数
     */
    unsubscribeOverallStatusChange(callback: (status: string, data?: any) => void): void {
      const index = this.registeredCallbacks.indexOf(callback);
      if (index !== -1) {
        this.registeredCallbacks.splice(index, 1);
      }
    },

    /**
     * 触发所有注册的回调函数
     * @param status 新的状态
     * @param data 可选的数据
     */
    triggerCallbacks(status: string, data?: any): void {
      this.registeredCallbacks.forEach(callback => {
        try {
          callback(status, data);
        } catch (error) {
          console.error('Error in status change callback:', error);
        }
      });
    },

    /**
     * 重置所有状态
     */
    reset(): void {
      // 清除所有剩余的定时器
      this.loadingModules.forEach(loadingModule => {
        if (loadingModule.timerId) {
          clearTimeout(loadingModule.timerId);
        }
      });

      // 重置状态
      this.modules = {};
      this.loadingModules = [];
      this.allLoaded = false;
      this.overallStatus = 'pending';
      this.registeredCallbacks = [];
    }
  }
});
