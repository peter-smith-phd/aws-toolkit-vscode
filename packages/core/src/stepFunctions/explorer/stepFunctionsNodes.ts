/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as nls from 'vscode-nls'
const localize = nls.loadMessageBundle()

import * as StepFunctions from '@aws-sdk/client-sfn'
import * as vscode from 'vscode'
import { StepFunctionsClient } from '../../shared/clients/stepFunctions'

import { AWSTreeNodeBase } from '../../shared/treeview/nodes/awsTreeNodeBase'
import { PlaceholderNode } from '../../shared/treeview/nodes/placeholderNode'
import { makeChildrenNodes } from '../../shared/treeview/utils'
import { toArrayAsync, toMap, updateInPlace } from '../../shared/utilities/collectionUtils'
import { listStateMachines } from '../../stepFunctions/utils'
import { StateMachineNode } from './stateMachineNode'

/* note: re-exporting StateMachineNode */
export { StateMachineNode } from './stateMachineNode'

const sfnNodeMap = new Map<string, StepFunctionsNode>()

export function refreshStepFunctionsTree(regionCode: string) {
    const node = sfnNodeMap.get(regionCode)

    if (node) {
        void vscode.commands.executeCommand('aws.refreshAwsExplorerNode', node)
    }
}

/**
 * An AWS Explorer node representing the Step Functions Service.
 * Contains State Machines for a specific region as child nodes.
 */
export class StepFunctionsNode extends AWSTreeNodeBase {
    private readonly stateMachineNodes: Map<string, StateMachineNode>

    public constructor(
        public override readonly regionCode: string,
        private readonly client = new StepFunctionsClient(regionCode)
    ) {
        super('Step Fynctions', vscode.TreeItemCollapsibleState.Collapsed)
        this.stateMachineNodes = new Map<string, StateMachineNode>()
        this.contextValue = 'awsStepFunctionsNode'
        sfnNodeMap.set(regionCode, this)
    }

    public override async getChildren(): Promise<AWSTreeNodeBase[]> {
        return await makeChildrenNodes({
            getChildNodes: async () => {
                await this.updateChildren()

                return [...this.stateMachineNodes.values()]
            },
            getNoChildrenPlaceholderNode: async () =>
                new PlaceholderNode(
                    this,
                    localize('AWS.explorerNode.stepfunctions.noStateMachine', '[No State Machines found]')
                ),
            sort: (nodeA, nodeB) => nodeA.functionName.localeCompare(nodeB.functionName),
        })
    }

    public async updateChildren(): Promise<void> {
        const functions: Map<string, StepFunctions.StateMachineListItem> = toMap(
            await toArrayAsync(listStateMachines(this.client)),
            (details) => details.name
        )

        updateInPlace(
            this.stateMachineNodes,
            functions.keys(),
            (key) => this.stateMachineNodes.get(key)!.update(functions.get(key)!),
            (key) => new StateMachineNode(this, this.regionCode, functions.get(key)!)
        )
    }
}
