using HelpdeskService as service from '../../srv/helpdesk-service';
annotate service.Tickets with {
    createdByUser @Common.ValueList : {
        $Type : 'Common.ValueListType',
        CollectionPath : 'Users',
        Parameters : [
            {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : createdByUser_ID,
                ValueListProperty : 'ID',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'userName',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'email',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'role',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'status',
            },
        ],
    }
};

annotate service.Tickets with {
    assignedToUser @Common.ValueList : {
        $Type : 'Common.ValueListType',
        CollectionPath : 'Users',
        Parameters : [
            {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : assignedToUser_ID,
                ValueListProperty : 'ID',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'userName',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'email',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'role',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'status',
            },
        ],
    }
};

annotate service.Tickets with {
    category @Common.ValueList : {
        $Type : 'Common.ValueListType',
        CollectionPath : 'TicketCategories',
        Parameters : [
            {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : category_ID,
                ValueListProperty : 'ID',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'name',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'description',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'defaultPriority',
            },
        ],
    }
};


annotate service.AuditLogs with @(
    UI.LineItem : [
        {
            Value : action,
            Label : 'Action'
        },
        {
            Value : oldValue,
            Label : 'Old Value'
        },
        {
            Value : newValue,
            Label : 'New Value'
        },
        {
            Value : remarks,
            Label : 'Remarks'
        },
        {
            Value : createdAt,
            Label : 'Created At'
        },
        {
            Value : createdBy,
            Label : 'Created By'
        }
    ]
);
