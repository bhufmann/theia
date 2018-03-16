/*
 * Copyright (C) 2018 Red Hat, Inc.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { injectable, inject } from "inversify";
import { CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry } from "@theia/core/lib/common";
import { MAIN_MENU_BAR } from "@theia/core/lib/common/menu";
import { DebugService } from "../common/debug-model";
import { DebugClientFactory } from "./debug-client";

export namespace DebugMenus {
    export const DEBUG = [...MAIN_MENU_BAR, "4_debug"];
    export const DEBUG_START = [...DEBUG, '1_start'];
    export const DEBUG_STOP = [...DEBUG, '2_stop'];
}

export namespace DEBUG_COMMANDS {
    export const START = {
        id: 'debug.start',
        label: 'Start'
    };

    export const STOP = {
        id: 'debug.stop',
        label: 'Stop'
    };
}

@injectable()
export class DebugCommandHandlers implements MenuContribution, CommandContribution {

    @inject(DebugService)
    protected readonly debug: DebugService;
    @inject(DebugClientFactory)
    protected readonly debugClientFactory: DebugClientFactory;

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerSubmenu(DebugMenus.DEBUG, 'Debug');
        menus.registerMenuAction(DebugMenus.DEBUG_START, {
            commandId: DEBUG_COMMANDS.START.id
        });
        menus.registerMenuAction(DebugMenus.DEBUG_STOP, {
            commandId: DEBUG_COMMANDS.STOP.id
        });
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(DEBUG_COMMANDS.START);
        registry.registerHandler(DEBUG_COMMANDS.START.id, {
            execute: () => {
                this.debug.start({ command: "" }).then((sessionId) => {
                    if (sessionId) {
                        const debugClient = this.debugClientFactory.get(sessionId);
                        debugClient.sendRequest({ command: "", seq: -1, type: "" });
                    }
                });
            },
            isEnabled: () => true,
            isVisible: () => true
        });

        registry.registerCommand(DEBUG_COMMANDS.STOP);
        registry.registerHandler(DEBUG_COMMANDS.STOP.id, {
            execute: () => { },
            isEnabled: () => true,
            isVisible: () => true
        });
    }
}
