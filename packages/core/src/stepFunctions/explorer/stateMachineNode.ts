/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as os from 'os'
import * as nls from 'vscode-nls'
const localize = nls.loadMessageBundle()

import * as StepFunctions from '@aws-sdk/client-sfn'
import * as vscode from 'vscode'
import { StepFunctionsClient } from '../../shared/clients/stepFunctions'

import { AWSResourceNode } from '../../shared/treeview/nodes/awsResourceNode'
import { AWSTreeNodeBase } from '../../shared/treeview/nodes/awsTreeNodeBase'
import { PlaceholderNode } from '../../shared/treeview/nodes/placeholderNode'
import { makeChildrenNodes } from '../../shared/treeview/utils'
import { getIcon } from '../../shared/icons'
import { toArrayAsync, toMap, updateInPlace } from '../../shared/utilities/collectionUtils'
import { StateMachineExecutionNode } from './stateMachineExecutionNode'
import { listExecutions } from '../../stepFunctions/utils'

/**
 * Represents a Step Functions state machine in the Explorer view. This node
 * appears immediately underneath the "Step Functions" node. A StateMachineNode
 * will contain children of type StateMachineExecutionNode, representing
 * the most recent executions of that state machine.
 */
export class StateMachineNode extends AWSTreeNodeBase implements AWSResourceNode {
    public static readonly contextValue = 'awsStateMachineNode'
    public static readonly maxExecutionsToShow = 10

    private readonly stateMachineExecutionNodes: Map<string, StateMachineExecutionNode>

    public constructor(
        public readonly parent: AWSTreeNodeBase,
        public override readonly regionCode: string,
        public details: StepFunctions.StateMachineListItem,
        private readonly client: StepFunctionsClient
    ) {
        super('', vscode.TreeItemCollapsibleState.Collapsed)
        this.stateMachineExecutionNodes = new Map<string, StateMachineExecutionNode>()
        this.update(details)
        this.iconPath = getIcon('aws-stepfunctions-preview')
        this.contextValue = StateMachineNode.contextValue
    }

    public override async getChildren(): Promise<AWSTreeNodeBase[]> {
        return await makeChildrenNodes({
            getChildNodes: async () => {
                await this.updateChildren()
                return [...this.stateMachineExecutionNodes.values()]
            },
            getNoChildrenPlaceholderNode: async () =>
                new PlaceholderNode(
                    this,
                    localize('AWS.explorerNode.stepfunctions.noStateMachineExecution', '[No Executions found]')
                ),
            sort: (nodeA, nodeB) => {
                const dateA = nodeA.details.startDate as Date // startDate will never be undefined.
                const dateB = nodeB.details.startDate as Date
                return dateB.getTime() - dateA.getTime()
            },
        })
    }

    public async updateChildren(): Promise<void> {
        const executions: Map<string, StepFunctions.ExecutionListItem> = toMap(
            await toArrayAsync(listExecutions(this.client, this.arn, StateMachineNode.maxExecutionsToShow)),
            (details) => details.name
        )
        updateInPlace(
            this.stateMachineExecutionNodes,
            executions.keys(),
            (key) => this.stateMachineExecutionNodes.get(key)!.update(executions.get(key)!),
            (key) => new StateMachineExecutionNode(this, this.regionCode, executions.get(key)!)
        )
    }

    public update(details: StepFunctions.StateMachineListItem): void {
        this.details = details
        this.label = this.details.name || ''
        this.tooltip = `${this.details.name}${os.EOL}${this.details.stateMachineArn}`
    }

    public get functionName(): string {
        return this.details.name || ''
    }

    public get arn(): string {
        return this.details.stateMachineArn || ''
    }

    public get name(): string {
        if (this.details.name === undefined) {
            throw new Error('name expected but not found')
        }

        return this.details.name
    }
}
