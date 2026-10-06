// Copyright (c) 2024, Tech Ventures and contributors
// For license information, please see license.txt

frappe.ui.form.on('Gate Outward Pass', {
    refresh: function (frm) {
        if (frm.is_new()) {
            frm.set_value('date', frappe.datetime.now_datetime());
        }
        frm.fields_dict['dn_no'].get_query = function (doc) {
            return {
                filters: [
                    ["Delivery Note", "customer", "=", doc.customer], ["Delivery Note", "docstatus", "=", 1]
                ]

            };
        };
        frm.fields_dict['po_no'].get_query = function (doc) {
            return {
                filters: [
                    ["Purchase Order", "supplier", "=", doc.supplier], ["Purchase Order", "docstatus", "=", 1]
                ]

            };
        };
        frm.fields_dict['prr_no'].get_query = function (doc) {
            return {
                filters: [
                    ["Purchase Receipt", "supplier", "=", doc.supplier], ["Purchase Receipt", "docstatus", "=", 1],["Purchase Receipt", "is_return", "=", 1]
                ]

            };
        };
        frm.fields_dict['transporter'].get_query = function (doc) {
            return {
                filters: [
                    ["Supplier", "supplier_group", "=", "Transporter"]
                ]

            };
        };
    },
    get_items: function (frm) {
        let no = null;
        let source = null;

        if (frm.doc.dn_no) {
            no = frm.doc.dn_no;
            source = "DN";
        } else if (frm.doc.po_no) {
            no = frm.doc.po_no;
            source = "PO";
        } else if (frm.doc.prr_no) {
            no = frm.doc.prr_no;
            source = "PRR";
        }

        if (no) {
            fetch_gop_items(frm, no, source);
        } else {
            frappe.msgprint(__('Please select at least one reference'));
        }
    },
    fetch_sample_forms_item: function (frm) {
        new frappe.ui.form.MultiSelectDialog({
            doctype: "Sample Forms",
            target: frm,
            setters: {
                customer: null,
                article: null,
                sample_type: null
            },
            primary_action_label: __("Fetch Sample Forms"),
            get_query: function () {
                return {
                    filters: { docstatus: ["!=", 2] }
                };
            },
            action: function (selections) {
                if (!selections || !selections.length) {
                    frappe.msgprint(__('Please select at least one Sample Form'));
                    return;
                }
                fetch_sample_form_items(frm, selections);
                cur_dialog.hide();
            }
        });
    },
});

frappe.ui.form.on('Sample Form Item', {
    qty: function (frm) {
        calculate_total_qty(frm);
    },
    sample_form_items_remove: function (frm) {
        calculate_total_qty(frm);
    },
});

function fetch_sample_form_items(frm, sample_forms) {
    frappe.call({
        method: "gate_pass_knittex.gate_pass_knittex.doctype.utils.fetch_items.fetch_sample_form_items",
        args: {
            sample_forms: sample_forms
        },
        callback: function (response) {
            let existing = (frm.doc.sample_form_items || []).map(r => r.sample_form);
            (response.message.sfi || []).forEach(function (p) {
                if (existing.includes(p.sample_form)) return;
                let entry = frm.add_child("sample_form_items");
                entry.sample_form = p.sample_form;
                entry.customer = p.customer;
                entry.article_no = p.article_no;
                entry.style = p.style;
                entry.qty = p.qty;
                entry.sample_type = p.sample_type;
            });
            frm.refresh_field('sample_form_items');
            calculate_total_qty(frm);
        }
    });
}

function calculate_total_qty(frm) {
    let total = (frm.doc.sample_form_items || []).reduce((sum, r) => sum + flt(r.qty), 0);
    frm.set_value('total_qty', total);
}

function fetch_gop_items(frm, no,source) {
    if (no) {
        
        // Clear existing data before adding new entries
        frm.clear_table("gate_outward_pass_items");

        frappe.call({
            method: "gate_pass_knittex.gate_pass_knittex.doctype.utils.fetch_items.fetch_gop_items",
            args: {
                no: no,
                source: source
            },
            callback: function (response) {
                if (response.message.dni) {
                    response.message.dni.forEach(function (p) {
                        let entry = frm.add_child("gate_outward_pass_items");
                        entry.item_code = p.item_code,
                            entry.qty = p.qty,
                            entry.uom = p.uom,
                            entry.description = p.description

                    });
                }
                frm.refresh_field('gate_outward_pass_items');
            }
        });
    }
}
