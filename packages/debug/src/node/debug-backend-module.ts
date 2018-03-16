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

import { ConnectionHandler, JsonRpcConnectionHandler, bindContributionProvider } from "@theia/core/lib/common";
import { ContainerModule, interfaces } from 'inversify';
import {
    DebugConfigurationManager,
    DebugConfigurationManagerImpl,
    DebugServiceImpl,
    DebugSessionManager,
    DebugSessionManagerImpl
} from "./debug-service";
import {
    DebugPath,
    DebugService,
    DebugConfigurationContribution,
    DebugAdapterExecutable
} from "../common/debug-model";
import { DebugAdapterSession } from "./debug-adapter";

export default new ContainerModule(bind => {
    bind(DebugConfigurationManager).to(DebugConfigurationManagerImpl).inSingletonScope();
    bind(DebugSessionManager).to(DebugSessionManagerImpl).inSingletonScope();
    bindContributionProvider(bind, DebugConfigurationContribution);

    bind(DebugService).to(DebugServiceImpl).inSingletonScope();
    bind(ConnectionHandler).toDynamicValue(context =>
        new JsonRpcConnectionHandler(DebugPath, client => {
            const service = context.container.get<DebugService>(DebugService);
            client.onDidCloseConnection(() => service.dispose());
            return service;
        })
    ).inSingletonScope();

    bind<interfaces.Factory<DebugAdapterSession>>("Factory<DebugAdapterSession>").toFactory<DebugAdapterSession>(context => {
        return (sessionId: string, executable: DebugAdapterExecutable) => {
            let session = context.container.get(DebugAdapterSession);
            session.assistedInit(sessionId, executable);
            return session;
        };
    });
});
