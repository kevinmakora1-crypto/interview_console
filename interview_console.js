frappe.pages['interview_console'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: '',
		single_column: true
	});

	// Simple and reliable rendering
	var content = frappe.render_template('interview_console', {});
	if (content) {
		$(wrapper).find('.layout-main-section').empty().append(content);
		// Initialize logic
		setTimeout(function() {
			init_interview_console(wrapper);
		}, 100);
	} else {
		console.error('Interview Console template failed to render.');
	}
};

function init_interview_console(wrapper) {
	var $w = function(selector) { return $(wrapper).find(selector); };

	var matrix_data = [
		["Excellent professional appearance", "Stable career growth", "Highly enthusiastic attitude", "Expert fire systems", "Exceeds performance goals", "Perfect instruction following", "Ideal cultural fit", "Flawless written communication", "Deep technical expertise", "Native reading comprehension", "Full verbal understanding", "Eloquent natural speaker"],
		["Clean grooming standards", "Consistent work history", "Positive professional outlook", "Proficient equipment handling", "Steady reliable effort", "Direct task completion", "Good team alignment", "Good writing skills", "Solid technical knowledge", "Strong reading ability", "Clear message comprehension", "Fluent english speech"],
		["Average standard met", "Fair job stability", "Neutral worker attitude", "Basic technical skill", "Moderate work output", "Requires occasional guidance", "Fair social skills", "Basic grammar usage", "Average technical ability", "Fair reading", "Adequate understanding", "Reasonable speaking clarity"],
		["Unkempt overall appearance", "Weak career history", "Negative behavioral signs", "Limited tool knowledge", "Low energy levels", "Unclear task focus", "Poor cultural alignment", "Poor writing ability", "Weak technical skills", "Weak reading", "Minimal instruction understanding", "Broken english speech"],
		["Poor personal hygiene", "No previous experience", "Aggressive or hostile behavior", "No technical knowledge", "Zero work effort", "Fails simple instructions", "Major cultural conflict", "No writing capability", "Fails technical check", "No reading ability", "No comprehension skills", "Cannot speak English"]
	];

	var state = {
		selected_applicant: null,
		scores: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		applicants: [],
		auto_fail: false
	};

	// Render Matrix
	var bodyHtml = '';
	for (var i = 0; i < 5; i++) {
		var rowNum = 5 - i;
		bodyHtml += '<tr><td class="ic-row-num">' + rowNum + '</td>';
		for (var j = 0; j < 12; j++) {
			bodyHtml += '<td><div class="ic-cell" data-score="' + rowNum + '" data-index="' + j + '">' + matrix_data[i][j] + '</div></td>';
		}
		bodyHtml += '</tr>';
	}
	$w('#ic-tbody').html(bodyHtml);

	// Handlers
	$w('.ic-cell').on('click', function() {
		var score = $(this).data('score');
		var index = $(this).data('index');
		if (state.scores[index] === score) {
			state.scores[index] = 0;
			$(this).removeClass('selected');
		} else {
			$w('.ic-cell[data-index="' + index + '"]').removeClass('selected');
			$(this).addClass('selected');
			state.scores[index] = score;
		}
		calculate_total();
	});

	$w('#ic-auto-fail').on('click', function() {
		state.auto_fail = !state.auto_fail;
		$(this).toggleClass('selected');
		calculate_total();
	});

	$w('#ic-reset-btn').on('click', function() {
		state.scores = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		state.auto_fail = false;
		$w('.ic-cell').removeClass('selected');
		$w('#ic-auto-fail').removeClass('selected');
		calculate_total();
	});

	function calculate_total() {
		var total = 0;
		for (var i = 0; i < state.scores.length; i++) total += state.scores[i];
		var percentage = Math.round((total / 60) * 100);
		var $pill = $w('#ic-score-pill');
		if (state.auto_fail) {
			$pill.text('FAIL').css({ 'background': '#fff1f2', 'color': '#ef4444' });
		} else {
			$pill.text(percentage + '/100').css({ 'background': '#e0f2fe', 'color': '#0369a1' });
		}
	}

	// Load Applicants
	frappe.call({
		method: 'frappe.client.get_list',
		args: {
			doctype: 'Job Applicant',
			fields: ['name', 'applicant_name'],
			filters: { 'status': ['!=', 'Rejected'] },
			limit: 50
		},
		callback: function(r) {
			if (r.message) {
				state.applicants = r.message;
				$w('#ic-candidate-count').text(state.applicants.length);
				render_list(state.applicants);
			}
		}
	});

	function render_list(list) {
		var html = '';
		for (var i = 0; i < list.length; i++) {
			var app = list[i];
			html += '<div class="ic-item" data-name="' + app.name + '">' +
				'<div class="ic-item-name">' + app.applicant_name + '</div>' +
				'<span class="ic-item-id">' + app.name + '</span>' +
				'</div>';
		}
		$w('#ic-list').html(html);
		$w('.ic-item').on('click', function() {
			var name = $(this).data('name');
			$w('.ic-item').removeClass('selected');
			$(this).addClass('selected');
			state.selected_applicant = { name: name };
			$w('#ic-age').text('25');
		});
	}

	$w('#ic-search').on('input', function() {
		var val = ($(this).val() || "").toLowerCase();
		var filtered = state.applicants.filter(function(a) {
			return (a.applicant_name || "").toLowerCase().indexOf(val) !== -1;
		});
		render_list(filtered);
	});

	$w('#ic-save-btn').on('click', function() {
		if (!state.selected_applicant) return frappe.msgprint('Select a candidate');
		frappe.show_alert({ message: 'Saved', indicator: 'green' });
	});
}