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

import { ContainerModule } from 'inversify';
import { DebugConfigurationContribution } from '@theia/debug/lib/common/debug-model';
import {
    NodeJsDebugRegistrator,
    NodeJsDebugConfigurationProvider,
    NodeJSDebugConfigurationProviderImpl,
} from './debug-nodejs';

export default new ContainerModule(bind => {
    bind(NodeJsDebugConfigurationProvider).to(NodeJSDebugConfigurationProviderImpl).inSingletonScope();
    bind(DebugConfigurationContribution).to(NodeJsDebugRegistrator);
});
