/**
 * Copyright (c) 2000-2013 Liferay, Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 */

package com.liferay.contenttargeting.rules.scorepoints;

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Deactivate;

import com.liferay.contenttargeting.api.model.BaseRule;
import com.liferay.contenttargeting.api.model.Rule;
import com.liferay.contenttargeting.model.CTUser;
import com.liferay.contenttargeting.model.RuleInstance;
import com.liferay.portal.kernel.json.JSONException;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.language.LanguageUtil;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.StringPool;

import java.util.Locale;
import java.util.Map;

import javax.portlet.PortletRequest;
import javax.portlet.PortletResponse;

/**
 * @author Eudaldo Alonso
 */
@Component(immediate = true, provide = Rule.class)
public class ScorePointsRule extends BaseRule {

	@Override
	public boolean evaluate(RuleInstance ruleInstance, CTUser ctUser)
		throws Exception {

		if (ruleInstance == null) {
			return false;
		}

		String typeSettings = ruleInstance.getTypeSettings();

		JSONObject jsonObj = JSONFactoryUtil.createJSONObject(typeSettings);

		int scorePoints = jsonObj.getInt("scorePoints");

		String ctUserTypeSettings = ctUser.getTypeSettings();

		JSONObject ctUserJsonObj = JSONFactoryUtil.createJSONObject(
			ctUserTypeSettings);

		int ctUserScorePoints = ctUserJsonObj.getInt("scorePoints");

		if (ctUserScorePoints >= scorePoints) {
			return true;
		}

		return false;
	}

	@Override
	public String getIcon() {
		return "icon-star";
	}

	@Override
	public String getSummary(RuleInstance ruleInstance, Locale locale) {
		String typeSettings = ruleInstance.getTypeSettings();

		String summary = StringPool.BLANK;

		try {
			JSONObject jsonObj = JSONFactoryUtil.createJSONObject(typeSettings);

			int scorePoints = jsonObj.getInt("scorePoints");

			String userSegmentName = ruleInstance.getUserSegmentName(locale);

			summary = LanguageUtil.format(
				locale, "users-with-x-score-points-of-x",
				new Object[] {scorePoints, userSegmentName});
		}
		catch (JSONException jse) {
		}

		return summary;
	}

	@Override
	public String processRule(
		PortletRequest request, PortletResponse response) {

		int scorePoints = ParamUtil.getInteger(request, "scorePoints");

		JSONObject jsonObj = JSONFactoryUtil.createJSONObject();

		jsonObj.put("scorePoints", scorePoints);

		return jsonObj.toString();
	}

	@Override
	protected void populateContext(
		RuleInstance ruleInstance, Map<String, Object> context) {

		if (ruleInstance != null) {
			String typeSettings = ruleInstance.getTypeSettings();

			try {
				JSONObject jsonObj = JSONFactoryUtil.createJSONObject(
					typeSettings);

				context.put("scorePoints", jsonObj.getInt("scorePoints"));
			}
			catch (JSONException jse) {
			}
		}
		else {
			context.put("scorePoints", 0);
		}
	}

}