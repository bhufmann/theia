/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable, interfaces, inject } from "inversify";
import { listen as doListen, createMessageConnection } from "vscode-ws-jsonrpc";
import { ConnectionHandler, JsonRpcProxyFactory, JsonRpcProxy } from "../../common";
import { Endpoint } from "../endpoint";
import { WebWorkerMessageReader } from "./web-worker-message-reader";
import { WebWorkerMessageWriter } from "./web-worker-message-writer";
import { WebSocketOptions, WebSocketFactory } from "./web-socket-factory";

export interface WorkerContructor {
    new(): Worker
}

export interface WebSocketConnectionOptions {
    /**
     * True by default.
     */
    reconnecting?: boolean;

    inWorker?: boolean;
}

@injectable()
export class WebSocketConnectionProvider {

    @inject(WebSocketFactory)
    protected readonly factory: WebSocketFactory;

    static createProxy<T extends object>(container: interfaces.Container, path: string, target?: object, options?: WebSocketConnectionOptions): JsonRpcProxy<T> {
        return container.get(WebSocketConnectionProvider).createProxy<T>(path, target, options);
    }

    /**
     * Create a proxy object to remote interface of T type
     * over a web socket connection for the given path.
     *
     * An optional target can be provided to handle
     * notifications and requests from a remote side.
     */
    createProxy<T extends object>(path: string, target?: object, options?: WebSocketConnectionOptions): JsonRpcProxy<T> {
        const factory = new JsonRpcProxyFactory<T>(target);
        this.listen({
            path,
            onConnection: c => factory.listen(c)
        }, options);
        return factory.createProxy();
    }

    /**
     * Install a connection handler for the given path.
     */
    listen(handler: ConnectionHandler, options?: WebSocketConnectionOptions): void {
        const op = <WebSocketOptions>{
            url: this.createWebSocketUrl(handler.path),
            reconnecting: true,
            ...options
        };
        if (options && options.inWorker !== undefined && options.inWorker && Worker) {
            this.listenInWorker(handler, op);
        } else {
            this.listenInMain(handler, op);
        }
    }

    protected listenInWorker(handler: ConnectionHandler, options: WebSocketOptions): void {
        const worker = new (require('./connection.webworker') as WorkerContructor)();
        worker.postMessage(options);

        const reader = new WebWorkerMessageReader(worker);
        const writer = new WebWorkerMessageWriter(worker);
        const connection = createMessageConnection(reader, writer);
        handler.onConnection(connection);
    }

    protected listenInMain(handler: ConnectionHandler, options: WebSocketOptions): void {
        const webSocket = this.factory.createWebSocket(options);
        webSocket.onerror = error => console.error(error);
        doListen({
            webSocket,
            onConnection: handler.onConnection.bind(handler)
        });
    }

    /**
     * Creates a websocket URL to the current location
     */
    createWebSocketUrl(path: string): string {
        const endpoint = new Endpoint({ path });
        return endpoint.getWebSocketUrl().toString();
    }

}
