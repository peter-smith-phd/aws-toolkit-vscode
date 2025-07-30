/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as os from 'os'
import * as StepFunctions from '@aws-sdk/client-sfn'

import { AWSResourceNode } from '../../shared/treeview/nodes/awsResourceNode'
import { AWSTreeNodeBase } from '../../shared/treeview/nodes/awsTreeNodeBase'
import { getIcon } from '../../shared/icons'

/**
 * Represents a Step Functions state machine in the Explorer view. This node
 * appears immediately underneath the "Step Functions" node. A StateMachineNode
 * will contain children of type StateMachineExecutionNode, representing
 * the most recent executions of that state machine.
 */
export class StateMachineNode extends AWSTreeNodeBase implements AWSResourceNode {
    public static contextValueStateMachine = 'awsStateMachineNode'

    public constructor(
        public readonly parent: AWSTreeNodeBase,
        public override readonly regionCode: string,
        public details: StepFunctions.StateMachineListItem
    ) {
        super('')
        this.update(details)
        this.iconPath = getIcon('aws-stepfunctions-preview')
        this.contextValue = StateMachineNode.contextValueStateMachine
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
